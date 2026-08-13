import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';
import * as relations from './relations';
import * as schema from './schema';

export const DATABASE_NAME = 'mesa.db';

export const expoDb = openDatabaseSync(DATABASE_NAME, { enableChangeListener: true });

// SQLite defaults `foreign_keys` OFF, per-connection — so the schema's
// `onDelete: 'cascade'` declarations were inert and FK constraints unenforced.
// Run it here, on the same handle passed to drizzle() below, before any query
// or migration executes. expo-sqlite caches one connection per database name,
// so this covers every caller (there is no second connection to miss).
expoDb.execSync('PRAGMA foreign_keys = ON;');

export const db = drizzle(expoDb, { schema: { ...schema, ...relations } });
