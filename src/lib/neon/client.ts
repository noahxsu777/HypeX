import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import type { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import * as schema from './schema';

let _db: NeonHttpDatabase<typeof schema> | null = null;

export function getDb(): NeonHttpDatabase<typeof schema> {
  if (!_db) {
    if (!process.env.NEON_DATABASE_URL) {
      throw new Error('NEON_DATABASE_URL environment variable is not set');
    }
    const sql = neon(process.env.NEON_DATABASE_URL);
    _db = drizzle(sql, { schema });
  }
  return _db;
}
