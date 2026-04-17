import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { newId, queryOneWith, withTransaction } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const leagueName = String(body.leagueName ?? "").trim();
    const yourName = String(body.yourName ?? "").trim();
    if (!leagueName || !yourName) {
      return NextResponse.json({ error: "League name and your name are required." }, { status: 400 });
    }

    const joinCode = nanoid(8).toUpperCase();

    const result = await withTransaction(async (tx) => {
      const leagueId = newId();
      const memberId = newId();
      const league = await queryOneWith<{
        id: string;
        name: string;
        joinCode: string;
      }>(
        tx,
        `INSERT INTO "League" (id, name, "joinCode") VALUES ($1, $2, $3) RETURNING id, name, "joinCode"`,
        [leagueId, leagueName, joinCode]
      );
      const member = await queryOneWith<{ id: string; name: string }>(
        tx,
        `INSERT INTO "Member" (id, "leagueId", name) VALUES ($1, $2, $3) RETURNING id, name`,
        [memberId, leagueId, yourName]
      );
      if (!league || !member) {
        throw new Error("Failed to create league or member");
      }
      return { league, member };
    });

    return NextResponse.json({
      league: {
        id: result.league.id,
        name: result.league.name,
        joinCode: result.league.joinCode,
      },
      member: { id: result.member.id, name: result.member.name },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Could not create league." }, { status: 500 });
  }
}
