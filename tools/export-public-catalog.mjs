import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const root = process.cwd();
const require = createRequire(path.join(root, 'api', 'package.json'));
const Database = require('better-sqlite3');
const dbPath = path.join(root, 'api', 'prisma', 'dev.db');
const output = path.join(root, 'app', 'src', 'data', 'catalog.json');
const db = new Database(dbPath, { readonly: true });
const rows = db.prepare(`
  SELECT id, source, sourceTrackId, title, artistsText, albumName, genre,
         popularity, durationMs, explicit, catalogVersion
  FROM Track WHERE status = 'PUBLISHED' ORDER BY searchTitle, id
`).all();
db.close();
mkdirSync(path.dirname(output), { recursive: true });
writeFileSync(output, `${JSON.stringify({ generatedFrom: 'api/prisma/dev.db', data: rows }, null, 2)}\n`, 'utf8');
console.log(`Exported ${rows.length} published tracks to ${output}`);
