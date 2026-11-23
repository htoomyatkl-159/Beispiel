import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from './generated/prisma/client.js';
import { resolveDatabaseUrl } from './database-url.js';

export function createDatabase(databaseUrl?: string): PrismaClient {
  const url = resolveDatabaseUrl(databaseUrl);
  mkdirSync(path.dirname(url.slice(5)), { recursive: true });
  const adapter = new PrismaBetterSqlite3({ url, timeout: 5000 });
  return new PrismaClient({ adapter });
}

export async function configureDatabase(db: PrismaClient): Promise<void> {
  await db.$queryRaw`PRAGMA journal_mode = WAL`;
  await db.$executeRaw`PRAGMA foreign_keys = ON`;
}
