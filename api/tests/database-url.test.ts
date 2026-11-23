import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';
import { API_ROOT, resolveDatabaseUrl } from '../src/database-url.js';

describe('one SQLite path for migrations and runtime', () => {
  it('resolves relative, absolute, and file-URI spellings to the same API-local file', () => {
    const filename = path.join(API_ROOT, 'prisma', 'dev.db');
    const expected = `file:${filename.replaceAll('\\', '/')}`;
    expect(resolveDatabaseUrl('file:./prisma/dev.db')).toBe(expected);
    expect(resolveDatabaseUrl(`file:${filename}`)).toBe(expected);
    expect(resolveDatabaseUrl(pathToFileURL(filename).href)).toBe(expected);
  });

  it.each(['file:../outside.db', 'file:', 'file::memory:', 'postgresql://example/db', 'file:./test.db?option=x'])
    ('rejects unsupported or outside-project database configuration %s', (value) => {
      expect(() => resolveDatabaseUrl(value)).toThrow();
    });
});
