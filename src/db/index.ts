import * as schema from "./schema";
import path from "path";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";

type DB = BetterSQLite3Database<typeof schema>;

const dbPath = process.env.DB_PATH || path.join(process.cwd(), "sqlite.db");
const migrationsFolder = path.join(process.cwd(), "src/db/migrations");

let _db: DB | null = null;

function isBunRuntime(): boolean {
  return "Bun" in globalThis;
}

function initDb(): DB {
  if (_db) return _db;

  if (isBunRuntime()) {
    // Use Bun's built-in SQLite
    const { Database } = require("bun:sqlite");
    const { drizzle } = require("drizzle-orm/bun-sqlite");
    const { migrate } = require("drizzle-orm/bun-sqlite/migrator");

    const sqlite = new Database(dbPath, { create: true });
    sqlite.exec("PRAGMA journal_mode = WAL;");
    _db = drizzle(sqlite, { schema }) as DB;

    try {
      migrate(_db, { migrationsFolder });
    } catch (e) {
      console.error("Auto-migration failed:", e);
    }
  } else {
    // Use better-sqlite3 for Node.js
    const Database = require("better-sqlite3");
    const { drizzle } = require("drizzle-orm/better-sqlite3");
    const { migrate } = require("drizzle-orm/better-sqlite3/migrator");

    const sqlite = new Database(dbPath);
    sqlite.pragma("journal_mode = WAL");
    _db = drizzle(sqlite, { schema }) as DB;

    try {
      migrate(_db, { migrationsFolder });
    } catch (e) {
      console.error("Auto-migration failed:", e);
    }
  }

  return _db!;
}

// Lazy proxy — the database is only initialised when a property is first accessed.
// This prevents crashes during `next build` (which uses Node.js workers that import
// this module but never actually call the database).
export const db: DB = new Proxy({} as DB, {
  get(_target, prop, receiver) {
    const realDb = initDb();
    return Reflect.get(realDb, prop, receiver);
  },
});
