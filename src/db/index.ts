import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import * as schema from "./schema";
import path from "path";

type DB = ReturnType<typeof drizzle<typeof schema>>;

const dbPath = process.env.DB_PATH || path.join(process.cwd(), "sqlite.db");
const migrationsFolder = path.join(process.cwd(), "src/db/migrations");

let _db: DB | null = null;

function initDb(): DB {
  if (_db) return _db;

  const sqlite = new Database(dbPath);
  sqlite.pragma("journal_mode = WAL");
  _db = drizzle(sqlite, { schema });

  // Auto-run migrations on startup so the app is self-bootstrapping.
  // Safe to call repeatedly — Drizzle tracks applied migrations.
  try {
    migrate(_db, { migrationsFolder });
  } catch (e) {
    console.error("Auto-migration failed:", e);
  }

  return _db;
}

// Lazy proxy — the database is only initialised when a property is first accessed.
// This prevents crashes during `next build` (Node.js workers import this module
// but never actually call the database).
export const db: DB = new Proxy({} as DB, {
  get(_target, prop, receiver) {
    const realDb = initDb();
    return Reflect.get(realDb, prop, receiver);
  },
});
