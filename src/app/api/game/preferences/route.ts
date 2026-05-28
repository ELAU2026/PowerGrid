import { NextResponse } from "next/server";
import { db } from "@/db";
import { players } from "@/db/schema";
import { eq, and } from "drizzle-orm";

// POST /api/game/preferences — player submits their preferences
export async function POST(req: Request) {
  try {
    const {
      gameId,
      sessionToken,
      willingnessToPay,
      driverImportance,
      name,
    } = await req.json();

    if (!gameId || !sessionToken) {
      return NextResponse.json(
        { error: "gameId and sessionToken required" },
        { status: 400 }
      );
    }

    const player = await db
      .select()
      .from(players)
      .where(
        and(
          eq(players.gameId, gameId.toUpperCase()),
          eq(players.sessionToken, sessionToken)
        )
      );

    if (player.length === 0) {
      return NextResponse.json(
        { error: "Player not found" },
        { status: 404 }
      );
    }

    await db
      .update(players)
      .set({
        willingnessToPay: willingnessToPay ?? 150,
        driverImportance: JSON.stringify(driverImportance),
        preferencesSubmitted: true,
        name: name ?? player[0].name,
      })
      .where(eq(players.id, player[0].id));

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Submit preferences error:", e);
    return NextResponse.json(
      { error: "Failed to submit preferences" },
      { status: 500 }
    );
  }
}
