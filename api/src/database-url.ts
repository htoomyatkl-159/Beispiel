import path from 'node:path';
import { fileURLToPath } from 'node:url';

// src/ and compiled dist/ both live directly under the API project root.
export const API_ROOT = fileURLToPath(new URL('../', import.meta.url));

/** Prisma CLI and runtime call this same resolver to prevent two different DBs. */
export function resolveDatabaseUrl(value = process.env.DATABASE_URL ?? 'file:./prisma/dev.db'): string {
  if (!value.startsWith('file:') || value.includes('?') || value === 'file::memory:') {
    throw new Error('DATABASE_URL must name a local SQLite file, for example file:./prisma/dev.db.');
  }
  const filename = value.startsWith('file://') ? fileURLToPath(value) : value.slice(5);
  if (!filename.trim()) throw new Error('DATABASE_URL must name a file.');
  const absolute = path.resolve(API_ROOT, filename);
  const relative = path.relative(API_ROOT, absolute);
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error('For this milestone the SQLite file must stay inside the API project.');
  }
  return `file:${absolute.replaceAll('\\', '/')}`;
}
