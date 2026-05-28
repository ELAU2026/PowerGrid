import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

// === Games ===
export const games = sqliteTable("games", {
  id: text("id").primaryKey(), // 6-char join code
  adminToken: text("admin_token").notNull(), // secret token for admin access
  phase: text("phase").notNull().default("lobby"),
  // "lobby" | "preferences" | "results" | "playing" | "game-over"
  quarter: integer("quarter").notNull().default(0),
  maxQuarters: integer("max_quarters").notNull().default(16),
  maxPlayers: integer("max_players").notNull().default(6),
  // Serialised JSON for complex state
  gridState: text("grid_state"), // JSON GridState
  driverHealth: text("driver_health"), // JSON DriverScores
  weightedScores: text("weighted_scores"), // JSON DriverScores
  averageWillingness: real("average_willingness").default(0),
  events: text("events"), // JSON GameEvent[]
  activeDisaster: text("active_disaster"), // JSON Disaster | null
  availableActions: text("available_actions"), // JSON QuarterAction[]
  score: integer("score").default(0),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date()
  ),
});

// === Players ===
export const players = sqliteTable("players", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  gameId: text("game_id")
    .notNull()
    .references(() => games.id),
  sessionToken: text("session_token").notNull(), // identifies this browser
  name: text("name").notNull(),
  willingnessToPay: real("willingness_to_pay").default(150),
  driverImportance: text("driver_importance"), // JSON Record<DriverKey, number>
  preferencesSubmitted: integer("preferences_submitted", { mode: "boolean" })
    .notNull()
    .default(false),
  // Per-quarter action tracking
  actionSubmittedForQuarter: integer("action_submitted_for_quarter").default(0),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date()
  ),
});

// === Action Log — tracks every action every player takes (for analytics) ===
export const actionLog = sqliteTable("action_log", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  gameId: text("game_id")
    .notNull()
    .references(() => games.id),
  playerId: integer("player_id")
    .notNull()
    .references(() => players.id),
  quarter: integer("quarter").notNull(),
  actionId: text("action_id").notNull(), // e.g. "build-substation"
  actionName: text("action_name").notNull(),
  actionCost: real("action_cost").notNull(),
  actionDriver: text("action_driver").notNull(), // DriverKey
  actionEffect: text("action_effect").notNull(), // JSON
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date()
  ),
});
