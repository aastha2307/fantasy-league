import { NextResponse } from "next/server";
import { newId, queryOne } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const joinCode = String(body.joinCode ?? "").trim().toUpperCase();
    const yourName = String(body.yourName ?? "").trim();
    if (!joinCode || !yourName) {
      return NextResponse.json({ error: "Join code and your name are required." }, { status: 400 });
    }

    const league = await queryOne<{ id: string; name: string; joinCode: string }>(
      `SELECT id, name, "joinCode" FROM "League" WHERE "joinCode" = $1`,
      [joinCode]
    );
    if (!league) {
      return NextResponse.json({ error: "Invalid join code." }, { status: 404 });
    }

    const existing = await queryOne<{ id: string; name: string }>(
      `SELECT id, name FROM "Member" WHERE "leagueId" = $1 AND name = $2`,
      [league.id, yourName]
    );
    if (existing) {
      return NextResponse.json({
        league: { id: league.id, name: league.name, joinCode: league.joinCode },
        member: { id: existing.id, name: existing.name },
      });
    }

    const member = await queryOne<{ id: string; name: string }>(
      `INSERT INTO "Member" (id, "leagueId", name) VALUES ($1, $2, $3) RETURNING id, name`,
      [newId(), league.id, yourName]
    );
    if (!member) {
      return NextResponse.json({ error: "Could not create member." }, { status: 500 });
    }

    return NextResponse.json({
      league: { id: league.id, name: league.name, joinCode: league.joinCode },
      member: { id: member.id, name: member.name },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Could not join league." }, { status: 500 });
  }
}
