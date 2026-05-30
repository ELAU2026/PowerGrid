import { NextResponse } from "next/server";
import { db } from "@/db";
import { games, players } from "@/db/schema";
import { eq, and } from "drizzle-orm";

// POST /api/game/satisfaction — player submits their final satisfaction score (1-10)
export async function POST(req: Request) {
  try {
    const { gameId, sessionToken, score } = await req.json();

    if (!gameId || !sessionToken || typeof score !== "number") {
      return NextResponse.json(
        { error: "gameId, sessionToken, and numeric score required" },
        { status: 400 }
      );
    }

    if (score < 1 || score > 10) {
      return NextResponse.json(
        { error: "Score must be between 1 and 10" },
        { status: 400 }
      );
    }

    const code = gameId.toUpperCase();
    const game = await db.select().from(games).where(eq(games.id, code));
    if (game.length === 0) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    if (game[0].phase !== "game-over") {
      return NextResponse.json(
        { error: "Game is not in game-over phase" },
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

    if (p.finalSatisfaction !== null) {
      return NextResponse.json(
        { error: "Satisfaction score already submitted" },
        { status: 400 }
      );
    }

    await db
      .update(players)
      .set({ finalSatisfaction: score })
      .where(eq(players.id, p.id));

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Submit satisfaction error:", e);
    return NextResponse.json(
      { error: "Failed to submit satisfaction score" },
      { status: 500 }
    );
  }
}
