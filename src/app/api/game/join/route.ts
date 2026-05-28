import { NextResponse } from "next/server";
import { db } from "@/db";
import { games, players } from "@/db/schema";
import { eq } from "drizzle-orm";

function generateToken(): string {
  const chars =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let token = "";
  for (let i = 0; i < 32; i++) {
    token += chars[Math.floor(Math.random() * chars.length)];
  }
  return token;
}

// POST /api/game/join — player joins a game
export async function POST(req: Request) {
  try {
    const { gameId, name } = await req.json();
    if (!gameId || !name) {
      return NextResponse.json(
        { error: "gameId and name are required" },
        { status: 400 }
      );
    }

    const code = gameId.toUpperCase().trim();
    const game = await db.select().from(games).where(eq(games.id, code));
    if (game.length === 0) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    const g = game[0];
    if (g.phase !== "lobby" && g.phase !== "preferences") {
      return NextResponse.json(
        { error: "Game is no longer accepting players" },
        { status: 400 }
      );
    }

    const existing = await db
      .select()
      .from(players)
      .where(eq(players.gameId, code));
    if (existing.length >= g.maxPlayers) {
      return NextResponse.json({ error: "Game is full" }, { status: 400 });
    }

    const sessionToken = generateToken();
    await db.insert(players).values({
      gameId: code,
      sessionToken,
      name: name.trim(),
      willingnessToPay: 150,
      driverImportance: JSON.stringify({
        growthDemand: 50,
        ageingAssets: 50,
        gridResilience: 50,
        innovation: 50,
        reliability: 50,
      }),
      preferencesSubmitted: false,
      actionSubmittedForQuarter: 0,
    });

    // Fetch the player we just created
    const created = await db
      .select()
      .from(players)
      .where(eq(players.sessionToken, sessionToken));

    return NextResponse.json({
      playerId: created[0]?.id ?? 0,
      sessionToken,
      gameId: code,
    });
  } catch (e) {
    console.error("Join game error:", e);
    return NextResponse.json(
      { error: "Failed to join game" },
      { status: 500 }
    );
  }
}
