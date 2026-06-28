import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import type { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import * as schema from './schema';

let _db: NeonHttpDatabase<typeof schema> | null = null;
let _initPromise: Promise<void> | null = null;

function getConnectionString(): string {
  // Support Vercel Neon integration env vars + custom NEON_DATABASE_URL
  const url =
    process.env.NEON_DATABASE_URL ||
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL;
  if (!url) {
    throw new Error(
      'No Neon connection string found. Set NEON_DATABASE_URL (or DATABASE_URL) in your environment.'
    );
  }
  return url;
}

async function initialize(): Promise<void> {
  const connectionString = getConnectionString();
  const sql = neon(connectionString);

  // Auto-create profiles table if it doesn't exist
  await sql`
    CREATE TABLE IF NOT EXISTS profiles (
      id          TEXT PRIMARY KEY,
      email       TEXT,
      username    TEXT UNIQUE,
      name        TEXT,
      bio         TEXT,
      website     TEXT,
      image       TEXT,
      is_private  BOOLEAN NOT NULL DEFAULT false,
      is_verified BOOLEAN NOT NULL DEFAULT false,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  _db = drizzle(sql, { schema });
}

export async function getDb(): Promise<NeonHttpDatabase<typeof schema>> {
  if (!_initPromise) {
    _initPromise = initialize();
  }
  await _initPromise;
  return _db!;
}
