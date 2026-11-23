import { createDatabase, configureDatabase } from './db.js';

// Open/close the SQLite file before Prisma migration commands. This is safe on
// an existing DB and avoids the first-file creation failure observed on Windows.
const db = createDatabase();
try {
  await configureDatabase(db);
} finally {
  await db.$disconnect();
}
