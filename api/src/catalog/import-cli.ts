import { parseArgs } from 'node:util';
import { createDatabase, configureDatabase } from '../db.js';
import { importCatalog } from './import.js';

const db = createDatabase();
try {
  const { values } = parseArgs({ options: { file: { type: 'string' } }, strict: true });
  if (!values.file) throw new Error('Usage: npm run catalog:import -- --file "PATH_TO_M01_CATALOG_CSV"');
  await configureDatabase(db);
  console.log(JSON.stringify(await importCatalog(db, values.file), null, 2));
} catch (error) {
  console.error(`Catalog import failed: ${error instanceof Error ? error.message : 'Unknown error.'}`);
  process.exitCode = 1;
} finally {
  await db.$disconnect();
}
