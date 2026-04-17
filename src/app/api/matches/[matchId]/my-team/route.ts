import { NextResponse } from "next/server";
import { queryOne } from "@/lib/db";

export async function GET(req: Request, ctx: { params: Promise<{ matchId: string }> }) {
  const { matchId } = await ctx.params;
  const memberId = new URL(req.url).searchParams.get("memberId");
  if (!memberId) {
    return NextResponse.json({ error: "memberId required" }, { status: 400 });
  }

  const member = await queryOne<{ id: string; leagueId: string }>(
    `SELECT id, "leagueId" FROM "Member" WHERE id = $1`,
    [memberId]
  );
  if (!member) {
    return NextResponse.json({ error: "Invalid member" }, { status: 403 });
  }

  const match = await queryOne<{ id: string; leagueId: string }>(
    `SELECT id, "leagueId" FROM "Match" WHERE id = $1`,
    [matchId]
  );
  if (!match || match.leagueId !== member.leagueId) {
    return NextResponse.json({ error: "Invalid match" }, { status: 403 });
  }

  const submission = await queryOne(`SELECT * FROM "TeamSubmission" WHERE "memberId" = $1 AND "matchId" = $2`, [
    memberId,
    matchId,
  ]);

  return NextResponse.json({ submission });
}
