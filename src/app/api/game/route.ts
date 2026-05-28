import { NextResponse } from "next/server";
import { db } from "@/db";
import { games } from "@/db/schema";

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function generateToken(): string {
  const chars =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let token = "";
  for (let i = 0; i < 32; i++) {
    token += chars[Math.floor(Math.random() * chars.length)];
  }
  return token;
}

// POST /api/game — create a new game (admin)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const maxQuarters = Math.max(4, Math.min(32, body.maxQuarters ?? 16));
    const maxPlayers = Math.max(2, Math.min(20, body.maxPlayers ?? 6));

    const id = generateCode();
    const adminToken = generateToken();

    await db.insert(games).values({
      id,
      adminToken,
      phase: "lobby",
      quarter: 0,
      maxQuarters,
      maxPlayers,
      gridState: null,
      driverHealth: null,
      weightedScores: null,
      averageWillingness: 0,
      events: JSON.stringify([]),
      activeDisaster: null,
      availableActions: null,
      score: 0,
    });

    return NextResponse.json({ gameId: id, adminToken });
  } catch (e) {
    console.error("Create game error:", e);
    return NextResponse.json(
      { error: "Failed to create game" },
      { status: 500 }
    );
  }
}
