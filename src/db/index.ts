import { createDatabase } from "@kilocode/app-builder-db";
import * as schema from "./schema";

type Database = ReturnType<typeof createDatabase<typeof schema>>;

let _db: Database | null = null;

export const db: Database = new Proxy({} as Database, {
  get(_target, prop, receiver) {
    if (!_db) {
      _db = createDatabase(schema);
    }
    return Reflect.get(_db, prop, receiver);
  },
});
