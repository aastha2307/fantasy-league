import { NextResponse } from "next/server";
import { newId, queryOne } from "@/lib/db";

const empty = JSON.stringify({ players: [] as string[], captain: "", viceCaptain: "" });

export async function POST(req: Request, ctx: { params: Promise<{ matchId: string }> }) {
  try {
    const { matchId } = await ctx.params;
    const body = await req.json();
    const memberId = String(body.memberId ?? "");
    if (!memberId) {
      return NextResponse.json({ error: "memberId is required." }, { status: 400 });
    }

    const member = await queryOne<{ id: string; leagueId: string }>(
      `SELECT id, "leagueId" FROM "Member" WHERE id = $1`,
      [memberId]
    );
    if (!member) {
      return NextResponse.json({ error: "Invalid member." }, { status: 403 });
    }

    const match = await queryOne<{ id: string; leagueId: string }>(
      `SELECT id, "leagueId" FROM "Match" WHERE id = $1`,
      [matchId]
    );
    if (!match || match.leagueId !== member.leagueId) {
      return NextResponse.json({ error: "Invalid match." }, { status: 403 });
    }

    const submission = await queryOne(
      `INSERT INTO "TeamSubmission" (id, "memberId", "matchId", "playersJson")
       VALUES ($1, $2, $3, $4)
       ON CONFLICT ("memberId", "matchId") DO UPDATE SET "playersJson" = "TeamSubmission"."playersJson"
       RETURNING *`,
      [newId(), memberId, matchId, empty]
    );

    return NextResponse.json({ submission });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Could not create draft." }, { status: 500 });
  }
}
