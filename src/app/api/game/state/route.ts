import { NextResponse } from "next/server";
import { db } from "@/db";
import { games, players, actionLog } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { computeGameAnalytics } from "@/lib/analytics";
import type { DriverKey } from "@/lib/types";

// GET /api/game/state?gameId=XXX&sessionToken=YYY (or adminToken=ZZZ)
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const gameId = url.searchParams.get("gameId")?.toUpperCase();
    const sessionToken = url.searchParams.get("sessionToken");
    const adminToken = url.searchParams.get("adminToken");

    if (!gameId) {
      return NextResponse.json(
        { error: "gameId is required" },
        { status: 400 }
      );
    }

    const game = await db.select().from(games).where(eq(games.id, gameId));
    if (game.length === 0) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }
    const g = game[0];

    const allPlayers = await db
      .select()
      .from(players)
      .where(eq(players.gameId, gameId));

    // Determine role
    const isAdmin = adminToken && g.adminToken === adminToken;
    let currentPlayer = null;
    if (sessionToken && !isAdmin) {
      currentPlayer =
        allPlayers.find((p) => p.sessionToken === sessionToken) ?? null;
      if (!currentPlayer) {
        return NextResponse.json(
          { error: "Invalid session" },
          { status: 401 }
        );
      }
    }

    // Build player list (hide session tokens)
    const playerList = allPlayers.map((p) => ({
      id: p.id,
      name: p.name,
      willingnessToPay: p.willingnessToPay,
      driverImportance: p.driverImportance
        ? JSON.parse(p.driverImportance)
        : null,
      preferencesSubmitted: p.preferencesSubmitted,
      actionSubmittedForQuarter: p.actionSubmittedForQuarter,
    }));

    // Build analytics for game-over or admin view
    let analytics = null;
    if (g.phase === "game-over" || isAdmin) {
      const allActions = await db
        .select()
        .from(actionLog)
        .where(eq(actionLog.gameId, gameId));

      const playersForAnalytics = allPlayers.map((p) => ({
        id: p.id,
        name: p.name,
        willingnessToPay: p.willingnessToPay ?? 150,
        statedPriorities: p.driverImportance
          ? JSON.parse(p.driverImportance)
          : {
              growthDemand: 50,
              ageingAssets: 50,
              gridResilience: 50,
              innovation: 50,
              reliability: 50,
            },
      }));

      const actionsForAnalytics = allActions.map((a) => ({
        playerId: a.playerId,
        actionId: a.actionId,
        actionName: a.actionName,
        actionCost: a.actionCost,
        actionDriver: a.actionDriver,
        actionEffect: JSON.parse(a.actionEffect) as Record<string, number>,
        quarter: a.quarter,
      }));

      analytics = computeGameAnalytics(
        playersForAnalytics,
        actionsForAnalytics
      );
    }

    const response: Record<string, unknown> = {
      game: {
        id: g.id,
        phase: g.phase,
        quarter: g.quarter,
        maxQuarters: g.maxQuarters,
        maxPlayers: g.maxPlayers,
        averageWillingness: g.averageWillingness,
        weightedScores: g.weightedScores
          ? JSON.parse(g.weightedScores)
          : null,
        gridState: g.gridState ? JSON.parse(g.gridState) : null,
        driverHealth: g.driverHealth ? JSON.parse(g.driverHealth) : null,
        events: g.events ? JSON.parse(g.events) : [],
        activeDisaster: g.activeDisaster
          ? JSON.parse(g.activeDisaster)
          : null,
        availableActions: g.availableActions
          ? JSON.parse(g.availableActions)
          : [],
        score: g.score,
      },
      players: playerList,
      isAdmin: !!isAdmin,
      currentPlayerId: currentPlayer?.id ?? null,
      analytics,
    };

    // For admin, count who submitted actions this quarter
    if (isAdmin && g.phase === "playing") {
      const submitted = allPlayers.filter(
        (p) => p.actionSubmittedForQuarter === g.quarter
      ).length;
      (response as Record<string, unknown>).actionsSubmittedCount = submitted;
      (response as Record<string, unknown>).totalPlayers = allPlayers.length;
    }

    // For admin, count who submitted preferences
    if (isAdmin && g.phase === "preferences") {
      const submitted = allPlayers.filter(
        (p) => p.preferencesSubmitted
      ).length;
      (response as Record<string, unknown>).preferencesSubmittedCount =
        submitted;
      (response as Record<string, unknown>).totalPlayers = allPlayers.length;
    }

    // For player, include their own action status
    if (currentPlayer) {
      (response as Record<string, unknown>).myPreferencesSubmitted =
        currentPlayer.preferencesSubmitted;
      (response as Record<string, unknown>).myActionSubmittedForQuarter =
        currentPlayer.actionSubmittedForQuarter;

      // Include player's own action history
      const myActions = await db
        .select()
        .from(actionLog)
        .where(
          and(
            eq(actionLog.gameId, gameId),
            eq(actionLog.playerId, currentPlayer.id)
          )
        );
      (response as Record<string, unknown>).myActions = myActions.map((a) => ({
        quarter: a.quarter,
        actionId: a.actionId,
        actionName: a.actionName,
        actionCost: a.actionCost,
        actionDriver: a.actionDriver as DriverKey,
      }));
    }

    return NextResponse.json(response);
  } catch (e) {
    console.error("Get state error:", e);
    return NextResponse.json(
      { error: "Failed to get game state" },
      { status: 500 }
    );
  }
}
