import { createHash } from 'node:crypto';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { parse } from 'csv-parse/sync';
import { z } from 'zod';
import type { PrismaClient } from '../generated/prisma/client.js';
import { normalizeSearch } from './validation.js';

export const CATALOG_SOURCE = 'spotify-tracks';
const digest = (data: string | Buffer) => createHash('sha256').update(data).digest('hex');
const hash = z.string().regex(/^[a-f0-9]{64}$/);
const manifestSchema = z.object({
  formatVersion: z.literal(1), profile: z.enum(['tiny', 'development', 'full']),
  catalogVersion: z.string().regex(/^catalog-v1-[a-f0-9]{20}$/),
  modelVersion: z.string().regex(/^cosine-v1-[a-f0-9]{20}$/),
  sourceSha256: hash, catalogSha256: hash, orderedIdsSha256: hash,
  cleaningVersion: z.string().min(1).max(100), rowCount: z.number().int().min(1).max(100_000),
  files: z.object({ 'catalog.csv': hash }),
});
const nonblank = z.string().min(1).max(2000).refine((text) => text.trim().length > 0);
const csvNumber = (max: number) => z.string().regex(/^\d+$/).transform(Number)
  .pipe(z.number().int().min(0).max(max));
const rowSchema = z.object({
  track_id: z.string().min(1).max(200).refine((id) => id === id.trim()),
  track_name: nonblank, artists: nonblank, album_name: z.string().max(2000),
  track_genre: nonblank,
  popularity: z.union([z.literal('').transform(() => null), csvNumber(100)]),
  duration_ms: z.union([z.literal('').transform(() => null), csvNumber(2_147_483_647)]),
  explicit: z.enum(['True', 'False']).transform((value) => value === 'True'),
}).strict();
const columns = ['track_id', 'track_name', 'artists', 'album_name', 'track_genre', 'popularity', 'duration_ms', 'explicit'];

/** Read explicit metadata inputs only. Never load Python models or sibling code. */
export async function readCatalogExport(filename: string) {
  const file = path.resolve(filename);
  if (path.basename(file) !== 'catalog.csv') throw new Error('Choose the M01 catalog.csv export, not the original dataset.csv.');
  if ((await stat(file)).size > 25 * 1024 * 1024) throw new Error('Catalog export exceeds 25 MB.');
  const bytes = await readFile(file);
  const manifest = manifestSchema.parse(JSON.parse(await readFile(path.join(path.dirname(file), 'manifest.json'), 'utf8')));
  if (digest(bytes) !== manifest.files['catalog.csv'] || digest(bytes) !== manifest.catalogSha256) {
    throw new Error('Catalog checksum does not match its M01 manifest. No database changes were made.');
  }
  const parsed: unknown[] = parse(bytes, {
    bom: true, skip_empty_lines: true,
    columns: (headers: string[]) => {
      if (headers.length !== columns.length || headers.some((header, index) => header !== columns[index])) {
        throw new Error('Catalog CSV headers must match the eight-column M01 export.');
      }
      return headers;
    },
  });
  const rows = parsed.map((row, index) => {
    const result = rowSchema.safeParse(row);
    if (!result.success) throw new Error(`Invalid catalog data at CSV row ${index + 2}. No database changes were made.`);
    return result.data;
  });
  const ids = rows.map((row) => row.track_id);
  if (rows.length !== manifest.rowCount || new Set(ids).size !== ids.length
      || digest(JSON.stringify(ids)) !== manifest.orderedIdsSha256) {
    throw new Error('Catalog row count, unique IDs, or ID ordering differs from the M01 manifest.');
  }
  return { manifest, rows };
}

/** Upsert and activate one complete snapshot atomically; never delete track IDs. */
export async function importCatalog(db: PrismaClient, filename: string) {
  const { manifest, rows } = await readCatalogExport(filename);
  return db.$transaction(async (tx) => {
    const existing = await tx.catalogImport.findUnique({ where: { catalogVersion: manifest.catalogVersion } });
    if (existing && (existing.exportChecksum !== manifest.catalogSha256 || existing.sourceChecksum !== manifest.sourceSha256
      || existing.modelVersion !== manifest.modelVersion || existing.cleaningVersion !== manifest.cleaningVersion)) {
      throw new Error('An existing catalog version has different provenance. Refusing to overwrite it.');
    }
    await tx.catalogImport.updateMany({ where: { source: CATALOG_SOURCE, isActive: true }, data: { isActive: false } });
    await tx.catalogImport.upsert({
      where: { catalogVersion: manifest.catalogVersion },
      create: { catalogVersion: manifest.catalogVersion, source: CATALOG_SOURCE,
        sourceChecksum: manifest.sourceSha256, exportChecksum: manifest.catalogSha256,
        cleaningVersion: manifest.cleaningVersion, modelVersion: manifest.modelVersion,
        rowCount: rows.length, isActive: true },
      update: { isActive: true },
    });
    // Archive rather than remove tracks absent from the newly selected snapshot.
    // This preserves IDs/references for later feedback and playlist milestones.
    await tx.track.updateMany({ where: { source: CATALOG_SOURCE, status: 'PUBLISHED' }, data: { status: 'ARCHIVED' } });
    for (const row of rows) {
      const data = { title: row.track_name, artistsText: row.artists, albumName: row.album_name || null,
        genre: row.track_genre, popularity: row.popularity, durationMs: row.duration_ms, explicit: row.explicit,
        status: 'PUBLISHED', catalogVersion: manifest.catalogVersion,
        searchTitle: normalizeSearch(row.track_name), searchArtists: normalizeSearch(row.artists) };
      await tx.track.upsert({
        where: { source_sourceTrackId: { source: CATALOG_SOURCE, sourceTrackId: row.track_id } },
        create: { source: CATALOG_SOURCE, sourceTrackId: row.track_id, ...data }, update: data,
      });
    }
    return { catalogVersion: manifest.catalogVersion, modelVersion: manifest.modelVersion,
      source: CATALOG_SOURCE, rowCount: rows.length, reusedCatalogVersion: Boolean(existing) };
  }, { timeout: 30_000, maxWait: 10_000 });
}
