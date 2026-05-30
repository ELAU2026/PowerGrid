# Tech Stack

## Core

| Technology | Version | Purpose |
|-----------|---------|---------|
| Next.js | 16.x | React framework (App Router) |
| React | 19.x | UI library |
| TypeScript | 5.9.x | Type safety |
| Tailwind CSS | 4.x | Styling |
| Bun | latest | Package manager + runtime |

## Database

| Technology | Purpose |
|-----------|---------|
| SQLite | Local file-based database (sqlite.db) |
| bun:sqlite | Built-in SQLite driver for Bun runtime (dev/sandbox) |
| better-sqlite3 | Native SQLite3 driver for Node.js (build/production) |
| Drizzle ORM | Type-safe database queries (dual-runtime driver) |
| drizzle-kit | Migration generation |

## Commands

| Command | Purpose |
|---------|---------|
| `bun install` | Install dependencies |
| `bun build` | Production build |
| `bun lint` | ESLint |
| `bun typecheck` | TypeScript checking |
| `bun db:generate` | Generate DB migrations |
| `bun db:migrate` | Run migrations (uses tsx under Node.js) |

## Configuration

- Path alias: `@/*` → `src/*`
- TypeScript: strict mode
- Tailwind: CSS-first v4 config
- ESLint: flat config
- DB path: configurable via `DB_PATH` env var, defaults to `./sqlite.db`

## Key Patterns

- Server Components by default, `"use client"` only for interactive pages
- API routes for all game state mutations
- 2-second polling for real-time sync (no WebSocket)
- Session tokens in localStorage for auth (no user accounts)
- JSON serialisation for complex state in SQLite text columns
