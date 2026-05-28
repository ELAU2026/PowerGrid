# Active Context: PowerGrid WSA — Power Grid Management Game

## Current State

**Project Status**: ✅ Fully playable turn-based multiplayer game

A turn-based multiplayer power grid management game set in Western Sydney, where players act as customers deciding investment priorities for a growing electricity network.

## Recently Completed

- [x] Base Next.js 16 setup with App Router
- [x] TypeScript configuration with strict mode
- [x] Tailwind CSS 4 integration
- [x] ESLint configuration
- [x] Memory bank documentation
- [x] Recipe system for common features
- [x] Game type system (`src/lib/types.ts`) — drivers, disasters, assets, game state
- [x] Game engine (`src/lib/game-engine.ts`) — scoring, actions, disasters, quarter progression
- [x] Game state management (`src/lib/game-context.tsx`) — React context + useReducer
- [x] Lobby screen with player count selection (2-6 players)
- [x] Player setup phase — willingness-to-pay slider ($50-$500/qtr), 5 driver importance sliders
- [x] Slider caps based on willingness to pay (higher payment = higher max slider value)
- [x] Weighted average scoring (priorities weighted by each customer's payment)
- [x] Results phase showing individual choices and weighted priority breakdown
- [x] Turn-based game board with 16 quarters across 4 years
- [x] Grid management: population growth, demand/capacity tracking, asset health/aging
- [x] 10 disaster types (heatwaves, storms, bushfire, cyber attacks, etc.)
- [x] 10+ investment actions with driver-specific effects
- [x] Game over screen with letter grade, final stats, and driver health vs priority comparison

## Current Structure

| File/Directory | Purpose | Status |
|----------------|---------|--------|
| `src/app/page.tsx` | Home — renders GameProvider + GameContainer | ✅ Ready |
| `src/app/layout.tsx` | Root layout with metadata | ✅ Ready |
| `src/app/globals.css` | Global styles (Tailwind) | ✅ Ready |
| `src/lib/types.ts` | All TypeScript types, constants, driver/disaster configs | ✅ Ready |
| `src/lib/game-engine.ts` | Game logic — scoring, actions, disasters, progression | ✅ Ready |
| `src/lib/game-context.tsx` | React context + useReducer for game state | ✅ Ready |
| `src/components/game/Lobby.tsx` | Game lobby — player count, scenario intro | ✅ Ready |
| `src/components/game/PlayerSetup.tsx` | Per-player setup — pay & priority sliders | ✅ Ready |
| `src/components/game/Results.tsx` | Weighted scoring results display | ✅ Ready |
| `src/components/game/GameBoard.tsx` | Main game board — grid status, actions, events | ✅ Ready |
| `src/components/game/GameOver.tsx` | End screen — grade, stats, comparison | ✅ Ready |
| `src/components/game/GameContainer.tsx` | Phase router — renders correct screen | ✅ Ready |
| `.kilocode/` | AI context & recipes | ✅ Ready |

## Game Architecture

### Phases
1. **Lobby** → Choose player count (2-6)
2. **Player Setup** → Each player picks willingness-to-pay and driver importance (pass-the-device)
3. **Results** → Shows average willingness and weighted priority scores
4. **Playing** → 16 quarters of turn-based grid management
5. **Game Over** → Final score, grade, and comparison

### 5 Drivers
- Growth Demands (airport, data centres, population)
- Replacing Ageing Assets (infrastructure end-of-life)
- Grid Resilience (disaster hardening)
- Innovation & DER/EV (solar, batteries, EVs)
- Reliability (uninterrupted supply)

### Key Mechanics
- Willingness to pay caps max slider value (low payers get less influence)
- Weighted average: `(player_importance × player_payment) / total_payments` per driver
- Disasters randomly trigger with increasing probability each quarter
- Assets age each quarter and degrade when nearing end-of-life
- Population and demand grow with accelerating rate (airport-driven)
- Milestone events at Q4 (airport opens), Q8 (data centre), Q12 (airport expansion)

## Available Recipes

| Recipe | File | Use Case |
|--------|------|----------|
| Add Database | `.kilocode/recipes/add-database.md` | Data persistence with Drizzle + SQLite |

## Pending Improvements

- [ ] Real-time multiplayer (currently pass-the-device)
- [ ] Persistent game state (database-backed)
- [ ] More granular action effects
- [ ] Visual grid map of Western Sydney
- [ ] Sound effects and animations
- [ ] Leaderboard / score history

## Session History

| Date | Changes |
|------|---------|
| Initial | Template created with base setup |
| 2026-05-28 | Built complete PowerGrid WSA game — lobby, player setup with payment/priority sliders, weighted scoring, turn-based game board with disasters, game over grading |
