import { execFileSync } from 'node:child_process';
import { mkdir, mkdtemp, rm } from 'node:fs/promises';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { API_ROOT, resolveDatabaseUrl } from '../src/database-url.js';
import { configureDatabase, createDatabase } from '../src/db.js';
import type { PrismaClient } from '../src/generated/prisma/client.js';

let directory: string;
let db: PrismaClient;

beforeAll(async () => {
  await mkdir(path.join(API_ROOT, '.tmp'), { recursive: true });
  directory = await mkdtemp(path.join(API_ROOT, '.tmp', 'user-model-tests-'));
  const url = resolveDatabaseUrl(`file:${path.join(directory, 'test.db')}`);
  const initial = createDatabase(url);
  await configureDatabase(initial);
  await initial.$disconnect();
  execFileSync(process.execPath, ['node_modules/prisma/build/index.js', 'migrate', 'deploy', '--config', 'prisma7.config.ts'],
    { cwd: API_ROOT, env: { ...process.env, DATABASE_URL: url }, timeout: 60_000, stdio: 'pipe' });
  db = createDatabase(url);
  await configureDatabase(db);
});

afterAll(async () => {
  await db?.$disconnect();
  if (directory) await rm(directory, { recursive: true, force: true });
});

describe('M07 User database model', () => {
  it('creates a user with safe defaults and nullable lastLoginAt', async () => {
    const user = await db.user.create({ data: {
      email: 'Student@Example.test', normalizedEmail: 'student@example.test',
      passwordHash: 'test-only-hash', displayName: 'Student',
    } });
    expect(user).toMatchObject({ role: 'USER', status: 'ACTIVE', lastLoginAt: null });
    expect(user.passwordHash).toBe('test-only-hash');
  });

  it('enforces normalized email uniqueness', async () => {
    await expect(db.user.create({ data: {
      email: 'Another@Example.test', normalizedEmail: 'student@example.test',
      passwordHash: 'test-only-hash', displayName: 'Another',
    } })).rejects.toThrow();
  });
});
