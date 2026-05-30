// Standalone migration script — accessing a db property triggers lazy init + auto-migration
import { db } from "./index";

// Access a property to trigger the lazy proxy initialisation (which runs migrations)
void db._.fullSchema;

console.log("Migrations complete.");
