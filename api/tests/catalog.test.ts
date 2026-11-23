import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { API_ROOT, resolveDatabaseUrl } from '../src/database-url.js';
import { createDatabase, configureDatabase } from '../src/db.js';
import type { PrismaClient } from '../src/generated/prisma/client.js';
import { importCatalog } from '../src/catalog/import.js';

let directory: string;
let url: string;
let db: PrismaClient;
let tinyExport: string;
const hash = (value: string) => createHash('sha256').update(value).digest('hex');

async function fixture(rows: string[][], overrides: Record<string, unknown> = {}) {
  const folder = await mkdtemp(path.join(directory, 'export-'));
  const columns = 'track_id,track_name,artists,album_name,track_genre,popularity,duration_ms,explicit\n';
  const csv = columns + rows.map((row) => row.map((field) => `"${field.replaceAll('"', '""')}"`).join(',')).join('\n') + '\n';
  const manifest = { formatVersion: 1, profile: 'tiny', catalogVersion: `catalog-v1-${hash(csv).slice(0, 20)}`,
    modelVersion: `cosine-v1-${hash(csv).slice(0, 20)}`, sourceSha256: 'a'.repeat(64), catalogSha256: hash(csv),
    orderedIdsSha256: hash(JSON.stringify(rows.map((row) => row[0]))), rowCount: rows.length,
    cleaningVersion: 'fixture-v1', files: { 'catalog.csv': hash(csv) }, ...overrides };
  await writeFile(path.join(folder, 'manifest.json'), JSON.stringify(manifest));
  await writeFile(path.join(folder, 'catalog.csv'), csv);
  return path.join(folder, 'catalog.csv');
}

beforeAll(async () => {
  await mkdir(path.join(API_ROOT, '.tmp'), { recursive: true });
  directory = await mkdtemp(path.join(API_ROOT, '.tmp', 'catalog-tests-'));
  url = resolveDatabaseUrl(`file:${path.join(directory, 'test.db')}`);
  db = createDatabase(url);
  await configureDatabase(db);
  await db.$disconnect();
  // Apply the actual committed migration through Prisma CLI, not a mock schema.
  execFileSync(process.execPath, ['node_modules/prisma/build/index.js', 'migrate', 'deploy', '--config', 'prisma7.config.ts'],
    { cwd: API_ROOT, env: { ...process.env, DATABASE_URL: url }, timeout: 60_000, stdio: 'pipe' });
  db = createDatabase(url);
  await configureDatabase(db);
  tinyExport = path.join(API_ROOT, 'tests/fixtures/tiny/catalog.csv');
}, 90_000);

beforeEach(async () => {
  if (!url.includes('catalog-tests-')) throw new Error('Refusing to clear anything but the isolated test database.');
  await db.track.deleteMany();
  await db.catalogImport.deleteMany();
  await importCatalog(db, tinyExport);
});

afterAll(async () => {
  if (db) await db.$disconnect();
  if (directory) {
    const resolved = path.resolve(directory);
    const relative = path.relative(path.join(API_ROOT, '.tmp'), resolved);
    if (relative.startsWith('catalog-tests-') && !relative.includes(path.sep) && !path.isAbsolute(relative)) {
      await rm(resolved, { recursive: true, force: true });
    }
  }
});

describe('SQLite catalog imports', () => {
  it('imports 40 rows twice without changing internal/source IDs or duplicating history', async () => {
    const first = await db.track.findMany({ orderBy: { sourceTrackId: 'asc' } });
    const result = await importCatalog(db, tinyExport);
    const second = await db.track.findMany({ orderBy: { sourceTrackId: 'asc' } });
    expect(first).toHaveLength(40);
    expect(second.map((row) => [row.id, row.sourceTrackId])).toEqual(first.map((row) => [row.id, row.sourceTrackId]));
    expect(result.reusedCatalogVersion).toBe(true);
    expect(await db.catalogImport.count()).toBe(1);
    expect(first.some((row) => row.sourceTrackId === '5SuOikwiRyPMVoIQDJUgSV')).toBe(true);
  });

  it('persists records when a new database client reconnects', async () => {
    const reopened = createDatabase(url);
    try { expect(await reopened.track.count()).toBe(40); }
    finally { await reopened.$disconnect(); }
  });

  it('enforces unique source keys and catalog foreign keys at database level', async () => {
    const song = await db.track.findFirstOrThrow();
    const { id: _id, createdAt: _created, updatedAt: _updated, ...data } = song;
    await expect(db.track.create({ data })).rejects.toThrow();
    await expect(db.track.create({ data: { ...data, sourceTrackId: 'new-id', catalogVersion: 'missing' } })).rejects.toThrow();
    expect(await db.track.count()).toBe(40);
  });

  it('rejects checksum changes, duplicate IDs, and invalid rows before database changes', async () => {
    const valid = ['x', 'Example', 'Artist', 'Album', 'demo', '50', '1000', 'False'];
    const duplicate = await fixture([valid, valid]);
    await expect(importCatalog(db, duplicate)).rejects.toThrow('unique IDs');
    const invalid = await fixture([['x', ' ', 'Artist', 'Album', 'demo', '50', '1000', 'False']]);
    await expect(importCatalog(db, invalid)).rejects.toThrow('Invalid catalog data');
    const corrupt = await fixture([valid]);
    await writeFile(corrupt, 'modified');
    await expect(importCatalog(db, corrupt)).rejects.toThrow('checksum');
    expect(await db.track.count()).toBe(40);
    expect(await db.catalogImport.count({ where: { isActive: true } })).toBe(1);
  });

  it('rolls back catalog activation, archival, and inserts when a database write fails', async () => {
    const file = await fixture([
      ['first-new', 'First new', 'Artist', '', 'demo', '', '', 'False'],
      ['abort-new', 'Abort import', 'Artist', '', 'demo', '', '', 'False'],
    ]);
    await db.$executeRawUnsafe(`CREATE TRIGGER reject_import BEFORE INSERT ON "Track"
      WHEN NEW.title = 'Abort import' BEGIN SELECT RAISE(ABORT, 'deliberate test failure'); END`);
    try { await expect(importCatalog(db, file)).rejects.toThrow(); }
    finally { await db.$executeRawUnsafe('DROP TRIGGER reject_import'); }
    expect(await db.track.count()).toBe(40);
    expect(await db.track.count({ where: { status: 'PUBLISHED' } })).toBe(40);
    expect(await db.catalogImport.count()).toBe(1);
  });

  it('rejects reuse of an existing catalog version for different metadata/provenance', async () => {
    const active = await db.catalogImport.findFirstOrThrow({ where: { isActive: true } });
    const file = await fixture([['other', 'Different', 'Artist', '', 'demo', '', '', 'False']],
      { catalogVersion: active.catalogVersion });
    await expect(importCatalog(db, file)).rejects.toThrow('provenance');
    expect(await db.track.count({ where: { status: 'PUBLISHED' } })).toBe(40);
    expect(await db.catalogImport.count()).toBe(1);
  });

  it('switches snapshots without deleting IDs and restores the tiny snapshot repeatably', async () => {
    const comedy = await db.track.findUniqueOrThrow({ where: { source_sourceTrackId: { source: 'spotify-tracks', sourceTrackId: '5SuOikwiRyPMVoIQDJUgSV' } } });
    const file = await fixture([[comedy.sourceTrackId, 'Changed metadata', 'Artist', '', 'demo', '', '', 'False']]);
    await importCatalog(db, file);
    expect(await db.track.count({ where: { status: 'PUBLISHED' } })).toBe(1);
    expect((await db.track.findUniqueOrThrow({ where: { id: comedy.id } })).title).toBe('Changed metadata');
    await importCatalog(db, tinyExport);
    expect(await db.track.count({ where: { status: 'PUBLISHED' } })).toBe(40);
    expect((await db.track.findUniqueOrThrow({ where: { id: comedy.id } })).title).toBe('Comedy');
    expect(await db.catalogImport.count({ where: { isActive: true } })).toBe(1);
  });
});

describe('catalog HTTP endpoints', () => {
  it('supports both list spellings, stable pagination, and final/empty pages', async () => {
    const app = createApp({ database: db });
    const first = await request(app).get('/api/v1/tracks?page=1&limit=7').expect(200);
    const again = await request(app).get('/api/v1/tracks/?page=1&limit=7').expect(200);
    expect(again.body.data).toEqual(first.body.data);
    expect(first.body.meta).toMatchObject({ page: 1, limit: 7, total: 40, hasNext: true });
    const second = await request(app).get('/api/v1/tracks?page=2&limit=7').expect(200);
    expect(second.body.data.some((row: { id: string }) => first.body.data.some((one: { id: string }) => one.id === row.id))).toBe(false);
    const last = await request(app).get('/api/v1/tracks?page=6&limit=7').expect(200);
    expect(last.body.data).toHaveLength(5);
    expect(last.body.meta.hasNext).toBe(false);
    const empty = await request(app).get('/api/v1/tracks?page=100&limit=7').expect(200);
    expect(empty.body.data).toEqual([]);
  });

  it('returns detail by internal ID while preserving the original source ID', async () => {
    const app = createApp({ database: db });
    const found = await request(app).get('/api/v1/search?q=CoMeDy&type=track').expect(200);
    expect(found.body.data).toHaveLength(1);
    const track = found.body.data[0];
    expect(track.sourceTrackId).toBe('5SuOikwiRyPMVoIQDJUgSV');
    const detail = await request(app).get(`/api/v1/tracks/${track.id}`).expect(200);
    expect(detail.body.data).toEqual(track);
    expect(detail.body.data.searchTitle).toBeUndefined();
    const missing = await request(app).get('/api/v1/tracks/missing-id').expect(404);
    expect(missing.body.error.code).toBe('NOT_FOUND');
  });

  it('searches artists, supports empty suggestions, and returns no-match results', async () => {
    const app = createApp({ database: db });
    const artist = await request(app).get('/api/v1/search').query({ q: 'hoshino', type: 'artist' }).expect(200);
    expect(artist.body.data[0].artistsText).toBe('Gen Hoshino');
    const empty = await request(app).get('/api/v1/search').expect(200);
    expect(empty.body.meta.total).toBe(40);
    const missing = await request(app).get('/api/v1/search?q=__no_such_song__').expect(200);
    expect(missing.body.meta.total).toBe(0);
  });

  it('handles literal punctuation, Unicode normalization, Burmese, and SQL-like strings safely', async () => {
    const file = await fixture([
      ['punctuation', '100%_Real', 'Artist', '', 'demo', '50', '1000', 'False'],
      ['unicode', 'Cafe\u0301 မြန်မာ', 'အဆိုတော်', '', 'demo', '', '', 'False'],
    ]);
    await importCatalog(db, file);
    const app = createApp({ database: db });
    for (const q of ['%', '_', '100%_']) {
      const result = await request(app).get('/api/v1/search').query({ q }).expect(200);
      expect(result.body.data.map((song: { sourceTrackId: string }) => song.sourceTrackId)).toEqual(['punctuation']);
    }
    for (const q of ['CAFÉ', 'မြန်မာ']) {
      const result = await request(app).get('/api/v1/search').query({ q }).expect(200);
      expect(result.body.data[0].sourceTrackId).toBe('unicode');
    }
    const injection = await request(app).get('/api/v1/search').query({ q: "' OR 1=1 --" }).expect(200);
    expect(injection.body.data).toEqual([]);
    expect(await db.track.count()).toBe(42); // old tiny records archived, never deleted
  });

  it.each(['page=0', 'page=1.5', 'limit=0', 'limit=101', 'limit=two', 'page=1000001', 'page=1&page=2', 'unknown=x'])
    ('returns a structured validation error for %s', async (query) => {
      const response = await request(createApp({ database: db })).get(`/api/v1/tracks?${query}`).expect(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.requestId).toBe(response.headers['x-request-id']);
    });

  it('rejects unsupported search types/oversized queries and hides archived detail', async () => {
    const app = createApp({ database: db });
    await request(app).get('/api/v1/search?type=album').expect(400);
    await request(app).get('/api/v1/search').query({ q: 'x'.repeat(201) }).expect(400);
    const track = await db.track.findFirstOrThrow();
    await db.track.update({ where: { id: track.id }, data: { status: 'ARCHIVED' } });
    await request(app).get(`/api/v1/tracks/${track.id}`).expect(404);
    expect((await request(app).get('/api/v1/tracks')).body.meta.total).toBe(39);
    await request(app).get('/api/v1/health/live').expect(200);
  });
});
