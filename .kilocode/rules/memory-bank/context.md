# Active Context: PowerGrid WSA — Synchronous Multiplayer Power Grid Game

## Current State

**Project Status**: ✅ Fully functional synchronous multiplayer game with scenario-driven behavioural economics testing

A turn-based multiplayer power grid management game set in Western Sydney. Players join from their own devices/browsers via a 6-character game code. An admin controls the game flow. Every quarter presents a rich crisis scenario with customer-impact narratives, testing whether players respond to the scenario or pursue their own agenda. The game measures stated vs revealed preferences, customer segmentation, and scenario responsiveness.

## Recently Completed

- [x] SQLite database with Drizzle ORM (games, players, action_log tables)
- [x] Server-side game state management via API routes
- [x] 2-second polling for real-time synchronisation across all devices
- [x] Admin dashboard: create game, configure duration (4-32 qtrs), max players (2-20)
- [x] Admin game controls: start preferences, calculate results, start game, advance quarters, end game
- [x] Player join flow: game code entry on own device
- [x] Player preferences phase: WTP slider + 5 driver importance sliders (capped by WTP)
- [x] Synchronous play: all players choose actions simultaneously, admin advances quarter
- [x] Budget = playerCount * avgWTP; action costs as % of quarterly revenue
- [x] 14 unique scenarios (weather, infrastructure, demand, cyber, innovation) with customer-impact narratives
- [x] Every quarter presents a scenario with headline, personal impact story, and decision prompt
- [x] Scenarios escalate in severity as the game progresses, never repeat until all used
- [x] Scenario responsiveness tracking: which scenario was active when each action was logged
- [x] 12 investment actions, quarter progression with growth events
- [x] Behavioural economics analytics engine:
  - Stated vs Revealed preferences (cosine similarity comparison)
  - Customer segmentation (6 segments based on behaviour patterns)
  - Action-outcome correlations and popularity tracking
  - Scenario responsiveness: per-scenario and per-player rates of addressing the presented crisis
  - Per-player responsiveness breakdown by scenario category (weather, infrastructure, demand, cyber, innovation)
  - WTP vs action count correlation (Pearson)
  - Budget efficiency scoring
  - Per-player dual-bar stated/revealed visualization

## Architecture

### Routes
| Route | Purpose |
|-------|---------|
| `/` | Landing page — join game or create game (admin) |
| `/admin?gameId=XXX` | Admin dashboard — full game control + analytics |
| `/play?gameId=XXX` | Player view — preferences, actions, results |

### API Routes
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/game` | POST | Create new game |
| `/api/game/join` | POST | Player joins game |
| `/api/game/state` | GET | Poll game state (player or admin) |
| `/api/game/preferences` | POST | Submit player preferences |
| `/api/game/action` | POST | Submit player action for quarter |
| `/api/game/admin` | POST | Admin control actions |

### Database Tables
| Table | Purpose |
|-------|---------|
| `games` | Game state, config, serialised grid/events |
| `players` | Player preferences, session tokens, action status |
| `action_log` | Every action taken (for analytics) |

### Game Phases
1. **Lobby** → Admin creates game, players join via code
2. **Preferences** → Each player submits WTP + driver importance on own device
3. **Results** → Shows weighted priorities + aggregate revenue
4. **Playing** → Simultaneous action selection each quarter, admin advances
5. **Game Over** → Full behavioural analytics + segmentation

### Customer Segments (Auto-classified)
- **Reliability Seeker** — prioritises uninterrupted supply
- **Growth Champion** — focused on meeting new demand
- **Innovation Advocate** — invests in DER, EVs, smart grid
- **Resilience Builder** — hardens grid against disasters
- **Budget Conscious** — low WTP, seeks value
- **Balanced Strategist** — spreads investment evenly

### Auth Model
- Admin: `adminToken` stored in localStorage, passed to API
- Players: `sessionToken` stored in localStorage, passed to API
- No user accounts — session-based for game duration

## Current File Structure

| File | Purpose |
|------|---------|
| `src/app/page.tsx` | Landing — join/create game |
| `src/app/admin/page.tsx` | Admin dashboard |
| `src/app/play/page.tsx` | Player view (all phases) |
| `src/app/api/game/*.ts` | 6 API route files |
| `src/lib/types.ts` | Game types, drivers, disasters |
| `src/lib/game-engine.ts` | Game logic (scoring, actions, progression) |
| `src/lib/analytics.ts` | Behavioural economics analytics engine |
| `src/db/schema.ts` | Drizzle schema (3 tables) |
| `src/db/index.ts` | Database client |
| `src/db/migrate.ts` | Migration runner |
| `drizzle.config.ts` | Drizzle config |

## Tech Stack

- Next.js 16 (App Router), React 19, TypeScript 5.9
- Tailwind CSS 4, Drizzle ORM, SQLite
- Bun package manager
- No WebSocket — uses 2-second polling for simplicity

## Session History

| Date | Changes |
|------|---------|
| Initial | Template created with base setup |
| 2026-05-28 | Built single-player PowerGrid WSA game |
| 2026-05-28 | Fixed budget model: revenue = playerCount * avgPay |
| 2026-05-28 | Converted to synchronous multiplayer with server-side state, admin dashboard, player devices, behavioural economics analytics, customer segmentation |
| 2026-05-28 | Added 14 scenario-driven turns with customer-impact narratives, responsiveness tracking, and per-scenario/per-player responsiveness analytics |
| 2026-05-29 | Revised base actions: renamed "Upgrade Transmission Lines" → "Upgrade Lines", removed "Community Solar Installation", added "Flexible Export", "Cybersecurity Equipment Upgrade", and "Upgrade Cables & Switchgear" actions with corresponding scenario relevance and applyAction effects |
