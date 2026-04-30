import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';
import * as relations from './relations';
import * as schema from './schema';

export const DATABASE_NAME = 'mesa.db';

export const expoDb = openDatabaseSync(DATABASE_NAME, { enableChangeListener: true });
export const db = drizzle(expoDb, { schema: { ...schema, ...relations } });
