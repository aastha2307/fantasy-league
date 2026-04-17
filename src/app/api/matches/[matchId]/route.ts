import { NextResponse } from "next/server";
import { queryOne } from "@/lib/db";

export async function GET(_req: Request, ctx: { params: Promise<{ matchId: string }> }) {
  const { matchId } = await ctx.params;
  const match = await queryOne<{ id: string; label: string; cricApiMatchId: string | null }>(
    `SELECT id, label, "cricApiMatchId" FROM "Match" WHERE id = $1`,
    [matchId]
  );
  if (!match) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(match);
}

export async function PATCH(req: Request, ctx: { params: Promise<{ matchId: string }> }) {
  try {
    const { matchId } = await ctx.params;
    const body = await req.json();
    const memberId = String(body.memberId ?? "");
    const cricApiMatchId =
      body.cricApiMatchId === null || body.cricApiMatchId === ""
        ? null
        : String(body.cricApiMatchId);

    if (!memberId) {
      return NextResponse.json({ error: "memberId is required." }, { status: 400 });
    }

    const match = await queryOne<{ id: string; leagueId: string }>(
      `SELECT id, "leagueId" FROM "Match" WHERE id = $1`,
      [matchId]
    );
    if (!match) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }

    const member = await queryOne<{ id: string }>(
      `SELECT id FROM "Member" WHERE id = $1 AND "leagueId" = $2`,
      [memberId, match.leagueId]
    );
    if (!member) {
      return NextResponse.json({ error: "Not a member of this league." }, { status: 403 });
    }

    const updated = await queryOne<{
      id: string;
      label: string;
      cricApiMatchId: string | null;
    }>(
      `UPDATE "Match" SET "cricApiMatchId" = $1 WHERE id = $2 RETURNING id, label, "cricApiMatchId"`,
      [cricApiMatchId, matchId]
    );

    if (!updated) {
      return NextResponse.json({ error: "Could not update match." }, { status: 500 });
    }

    return NextResponse.json({
      id: updated.id,
      label: updated.label,
      cricApiMatchId: updated.cricApiMatchId,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Could not update match." }, { status: 500 });
  }
}
