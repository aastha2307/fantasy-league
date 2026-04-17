import { NextResponse } from "next/server";
import { newId, queryOne } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const leagueId = String(body.leagueId ?? "");
    const memberId = String(body.memberId ?? "");
    const label = String(body.label ?? "").trim();
    const matchDateRaw = body.matchDate as string | undefined;
    if (!leagueId || !memberId || !label) {
      return NextResponse.json({ error: "leagueId, memberId, and label are required." }, { status: 400 });
    }

    const member = await queryOne<{ id: string }>(
      `SELECT id FROM "Member" WHERE id = $1 AND "leagueId" = $2`,
      [memberId, leagueId]
    );
    if (!member) {
      return NextResponse.json({ error: "Not a member of this league." }, { status: 403 });
    }

    const matchDate =
      matchDateRaw && matchDateRaw.length > 0 ? new Date(matchDateRaw) : null;

    const match = await queryOne(
      `INSERT INTO "Match" (id, "leagueId", label, "matchDate")
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [
        newId(),
        leagueId,
        label,
        matchDate && !Number.isNaN(matchDate.getTime()) ? matchDate : null,
      ]
    );

    return NextResponse.json(match);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Could not create match." }, { status: 500 });
  }
}
