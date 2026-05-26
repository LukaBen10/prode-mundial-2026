import { createClient, type Client } from '@libsql/client';

let _db: Client | null = null;

function getDB(): Client {
  if (!_db) {
    _db = createClient({
      url: process.env.TURSO_DATABASE_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
  }
  return _db;
}

const db = new Proxy({} as Client, {
  get(_, prop) {
    return (...args: unknown[]) => (getDB() as unknown as Record<string, (...a: unknown[]) => unknown>)[prop as string](...args);
  },
});

export default db;
