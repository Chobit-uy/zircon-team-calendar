import { createClient, Client } from '@libsql/client';
import { CREATE_TABLES_SQL } from './_schema';

let client: Client | null = null;
let initialized = false;

export function getDb(): Client {
  if (!client) {
    client = createClient({
      url: process.env.TURSO_DATABASE_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
  }
  return client;
}

export async function initDb(): Promise<void> {
  if (initialized) return;
  const db = getDb();
  for (const statement of CREATE_TABLES_SQL.split(';').map(s => s.trim()).filter(Boolean)) {
    await db.execute(statement);
  }
  initialized = true;
}
