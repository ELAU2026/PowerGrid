import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import * as schema from "./schema";
import path from "path";

const dbPath = process.env.DB_PATH || path.join(process.cwd(), "sqlite.db");

const sqlite = new Database(dbPath);
sqlite.pragma("journal_mode = WAL");

export const db = drizzle(sqlite, { schema });

// Auto-run migrations on startup so the app is self-bootstrapping.
// This is safe to call repeatedly — Drizzle tracks which migrations
// have already been applied in a `__drizzle_migrations` table.
try {
  migrate(db, { migrationsFolder: path.join(process.cwd(), "src/db/migrations") });
} catch (e) {
  console.error("Auto-migration failed:", e);
}
