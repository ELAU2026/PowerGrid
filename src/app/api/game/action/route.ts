import { NextResponse } from "next/server";
import { db } from "@/db";
import { games, players, actionLog } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { applyAction } from "@/lib/game-engine";
import type { DriverScores, GridState, QuarterAction } from "@/lib/types";

// POST /api/game/action — player submits their action for this quarter
export async function POST(req: Request) {
  try {
    const { gameId, sessionToken, actionId } = await req.json();

    if (!gameId || !sessionToken) {
      return NextResponse.json(
        { error: "gameId and sessionToken required" },
        { status: 400 }
      );
    }

    const code = gameId.toUpperCase();
    const game = await db.select().from(games).where(eq(games.id, code));
    if (game.length === 0) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }
    const g = game[0];

    if (g.phase !== "playing") {
      return NextResponse.json(
        { error: "Game is not in playing phase" },
        { status: 400 }
      );
    }

    const player = await db
      .select()
      .from(players)
      .where(
        and(eq(players.gameId, code), eq(players.sessionToken, sessionToken))
      );
    if (player.length === 0) {
      return NextResponse.json(
        { error: "Player not found" },
        { status: 404 }
      );
    }

    const p = player[0];
    if (p.actionSubmittedForQuarter === g.quarter) {
      return NextResponse.json(
        { error: "Already submitted action for this quarter" },
        { status: 400 }
      );
    }

    // actionId can be "skip" for skipping
    if (actionId === "skip") {
      await db
        .update(players)
        .set({ actionSubmittedForQuarter: g.quarter })
        .where(eq(players.id, p.id));

      return NextResponse.json({ ok: true, skipped: true });
    }

    // Find action in available actions
    const available: QuarterAction[] = g.availableActions
      ? JSON.parse(g.availableActions)
      : [];
    const action = available.find((a) => a.id === actionId);
    if (!action) {
      return NextResponse.json(
        { error: "Action not available" },
        { status: 400 }
      );
    }

    const gridState: GridState = g.gridState ? JSON.parse(g.gridState) : null;
    if (!gridState) {
      return NextResponse.json(
        { error: "Grid not initialised" },
        { status: 500 }
      );
    }

    if (gridState.budget < action.cost) {
      return NextResponse.json(
        { error: "Insufficient budget" },
        { status: 400 }
      );
    }

    // Apply action
    const driverHealth: DriverScores = g.driverHealth
      ? JSON.parse(g.driverHealth)
      : null;
    const { grid: newGrid, driverHealth: newHealth } = applyAction(
      gridState,
      driverHealth,
      action
    );

    // Log the event
    const events = g.events ? JSON.parse(g.events) : [];
    events.push({
      quarter: g.quarter,
      description: `${p.name} invested in: ${action.name}`,
      type: "achievement",
      icon: "✅",
    });

    // Save action log for analytics
    await db.insert(actionLog).values({
      gameId: code,
      playerId: p.id,
      quarter: g.quarter,
      actionId: action.id,
      actionName: action.name,
      actionCost: action.cost,
      actionDriver: action.driver,
      actionEffect: JSON.stringify(action.effect),
    });

    // Update game state and mark player as submitted
    await db
      .update(games)
      .set({
        gridState: JSON.stringify(newGrid),
        driverHealth: JSON.stringify(newHealth),
        events: JSON.stringify(events),
      })
      .where(eq(games.id, code));

    await db
      .update(players)
      .set({ actionSubmittedForQuarter: g.quarter })
      .where(eq(players.id, p.id));

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Submit action error:", e);
    return NextResponse.json(
      { error: "Failed to submit action" },
      { status: 500 }
    );
  }
}
