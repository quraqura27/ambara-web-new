import { neon } from '@neondatabase/serverless';
import { drizzle, type NeonHttpDatabase } from 'drizzle-orm/neon-http';
import * as schema from './schema';

type Database = NeonHttpDatabase<typeof schema>;

let dbInstance: Database | null = null;

function getDb() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not configured');
  }

  if (!dbInstance) {
    dbInstance = drizzle(neon(connectionString), { schema });
  }

  return dbInstance;
}

export const db = new Proxy({} as Database, {
  get(_target, prop, receiver) {
    const database = getDb() as unknown as Record<PropertyKey, unknown>;
    const value = Reflect.get(database, prop, receiver);

    return typeof value === 'function' ? value.bind(database) : value;
  },
});
