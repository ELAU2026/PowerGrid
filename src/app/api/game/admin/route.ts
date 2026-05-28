import { NextResponse } from "next/server";
import { db } from "@/db";
import { games, players } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  calculateAverageWillingnessFromPlayers,
  calculateWeightedDriverScoresFromPlayers,
  createInitialGridState,
  generateActions,
  rollForDisaster,
  applyDisasterDamage,
  progressQuarter,
  calculateFinalScore,
} from "@/lib/game-engine";
import type { DriverKey, DriverScores, GridState } from "@/lib/types";

// POST /api/game/admin — admin control actions
export async function POST(req: Request) {
  try {
    const { gameId, adminToken, action } = await req.json();

    if (!gameId || !adminToken) {
      return NextResponse.json(
        { error: "gameId and adminToken required" },
        { status: 400 }
      );
    }

    const code = gameId.toUpperCase();
    const game = await db.select().from(games).where(eq(games.id, code));
    if (game.length === 0) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }
    const g = game[0];

    if (g.adminToken !== adminToken) {
      return NextResponse.json({ error: "Not authorised" }, { status: 403 });
    }

    switch (action) {
      // Admin moves game from lobby to preferences phase
      case "start-preferences": {
        if (g.phase !== "lobby") {
          return NextResponse.json(
            { error: "Game must be in lobby phase" },
            { status: 400 }
          );
        }
        await db
          .update(games)
          .set({ phase: "preferences" })
          .where(eq(games.id, code));
        return NextResponse.json({ ok: true, phase: "preferences" });
      }

      // Admin calculates results and shows them
      case "calculate-results": {
        if (g.phase !== "preferences") {
          return NextResponse.json(
            { error: "Game must be in preferences phase" },
            { status: 400 }
          );
        }

        const allPlayers = await db
          .select()
          .from(players)
          .where(eq(players.gameId, code));

        const playerData = allPlayers.map((p) => ({
          willingnessToPay: p.willingnessToPay ?? 150,
          driverImportance: p.driverImportance
            ? (JSON.parse(p.driverImportance) as Record<DriverKey, number>)
            : {
                growthDemand: 50,
                ageingAssets: 50,
                gridResilience: 50,
                innovation: 50,
                reliability: 50,
              },
        }));

        const avg = calculateAverageWillingnessFromPlayers(playerData);
        const scores = calculateWeightedDriverScoresFromPlayers(playerData);

        await db
          .update(games)
          .set({
            phase: "results",
            averageWillingness: avg,
            weightedScores: JSON.stringify(scores),
          })
          .where(eq(games.id, code));

        return NextResponse.json({ ok: true, phase: "results" });
      }

      // Admin starts the game from results
      case "start-game": {
        if (g.phase !== "results") {
          return NextResponse.json(
            { error: "Game must be in results phase" },
            { status: 400 }
          );
        }

        const allPlayers = await db
          .select()
          .from(players)
          .where(eq(players.gameId, code));

        const avgWTP = g.averageWillingness ?? 150;
        const playerCount = allPlayers.length;
        const weightedScores: DriverScores = g.weightedScores
          ? JSON.parse(g.weightedScores)
          : {
              growthDemand: 50,
              ageingAssets: 50,
              gridResilience: 50,
              innovation: 50,
              reliability: 50,
            };

        const grid = createInitialGridState(avgWTP, playerCount);
        const driverHealth: DriverScores = {
          growthDemand: Math.min(
            60,
            weightedScores.growthDemand + 30
          ),
          ageingAssets: Math.min(50, weightedScores.ageingAssets + 20),
          gridResilience: Math.min(
            55,
            weightedScores.gridResilience + 25
          ),
          innovation: Math.min(40, weightedScores.innovation + 15),
          reliability: Math.min(65, weightedScores.reliability + 35),
        };
        const actions = generateActions(weightedScores, 1, grid);

        const events = [
          {
            quarter: 0,
            description:
              "Western Sydney Power Grid is now operational. The city is counting on you!",
            type: "achievement",
            icon: "🏙️",
          },
        ];

        await db
          .update(games)
          .set({
            phase: "playing",
            quarter: 1,
            gridState: JSON.stringify(grid),
            driverHealth: JSON.stringify(driverHealth),
            availableActions: JSON.stringify(actions),
            events: JSON.stringify(events),
            activeDisaster: null,
            score: 0,
          })
          .where(eq(games.id, code));

        return NextResponse.json({ ok: true, phase: "playing" });
      }

      // Admin advances to next quarter (after all players have submitted)
      case "advance-quarter": {
        if (g.phase !== "playing") {
          return NextResponse.json(
            { error: "Game must be in playing phase" },
            { status: 400 }
          );
        }

        const nextQuarter = (g.quarter ?? 0) + 1;

        if (nextQuarter > g.maxQuarters) {
          // Game over
          const gridState: GridState = JSON.parse(g.gridState!);
          const drvHealth: DriverScores = JSON.parse(g.driverHealth!);
          const wScores: DriverScores = JSON.parse(g.weightedScores!);
          const finalScore = calculateFinalScore(
            gridState,
            drvHealth,
            wScores
          );

          await db
            .update(games)
            .set({
              phase: "game-over",
              score: finalScore,
            })
            .where(eq(games.id, code));

          return NextResponse.json({ ok: true, phase: "game-over" });
        }

        // Progress the quarter
        const gridState: GridState = JSON.parse(g.gridState!);
        const drvHealth: DriverScores = JSON.parse(g.driverHealth!);
        const wScores: DriverScores = JSON.parse(g.weightedScores!);

        const {
          grid: progressedGrid,
          driverHealth: progressedHealth,
          events: quarterEvents,
        } = progressQuarter(gridState, drvHealth, nextQuarter);

        // Roll for disaster
        const disaster = rollForDisaster(nextQuarter);
        let finalGrid = progressedGrid;
        let finalHealth = progressedHealth;
        const existingEvents = g.events ? JSON.parse(g.events) : [];
        const allEvents = [...existingEvents, ...quarterEvents];

        if (disaster) {
          const dmg = applyDisasterDamage(
            progressedGrid,
            progressedHealth,
            disaster
          );
          finalGrid = dmg.grid;
          finalHealth = dmg.driverHealth;
          allEvents.push({
            quarter: nextQuarter,
            description: `DISASTER: ${disaster.name} — ${disaster.description}`,
            type: "disaster",
            icon: disaster.icon,
          });
        }

        const newActions = generateActions(wScores, nextQuarter, finalGrid);

        // Reset all players' action submitted status
        const allPlayers = await db
          .select()
          .from(players)
          .where(eq(players.gameId, code));

        for (const p of allPlayers) {
          await db
            .update(players)
            .set({ actionSubmittedForQuarter: 0 })
            .where(eq(players.id, p.id));
        }

        await db
          .update(games)
          .set({
            quarter: nextQuarter,
            gridState: JSON.stringify(finalGrid),
            driverHealth: JSON.stringify(finalHealth),
            events: JSON.stringify(allEvents),
            activeDisaster: disaster ? JSON.stringify(disaster) : null,
            availableActions: JSON.stringify(newActions),
          })
          .where(eq(games.id, code));

        return NextResponse.json({
          ok: true,
          quarter: nextQuarter,
          disaster: disaster?.name ?? null,
        });
      }

      // Admin ends the game early
      case "end-game": {
        const gridState: GridState = g.gridState
          ? JSON.parse(g.gridState)
          : createInitialGridState(150, 3);
        const drvHealth: DriverScores = g.driverHealth
          ? JSON.parse(g.driverHealth)
          : {
              growthDemand: 50,
              ageingAssets: 50,
              gridResilience: 50,
              innovation: 50,
              reliability: 50,
            };
        const wScores: DriverScores = g.weightedScores
          ? JSON.parse(g.weightedScores)
          : {
              growthDemand: 50,
              ageingAssets: 50,
              gridResilience: 50,
              innovation: 50,
              reliability: 50,
            };

        const finalScore = calculateFinalScore(gridState, drvHealth, wScores);

        await db
          .update(games)
          .set({
            phase: "game-over",
            score: finalScore,
          })
          .where(eq(games.id, code));

        return NextResponse.json({ ok: true, phase: "game-over" });
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (e) {
    console.error("Admin action error:", e);
    return NextResponse.json(
      { error: "Failed to perform admin action" },
      { status: 500 }
    );
  }
}
