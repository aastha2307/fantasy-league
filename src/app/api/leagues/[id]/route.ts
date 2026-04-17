import { NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const league = await queryOne(`SELECT * FROM "League" WHERE id = $1`, [id]);
  if (!league) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const members = await query(
    `SELECT * FROM "Member" WHERE "leagueId" = $1 ORDER BY "createdAt" ASC`,
    [id]
  );
  const matches = await query(
    `SELECT * FROM "Match" WHERE "leagueId" = $1 ORDER BY "matchDate" DESC NULLS LAST`,
    [id]
  );
  return NextResponse.json({ ...league, members, matches });
}
