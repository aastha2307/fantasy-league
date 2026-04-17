import { NextResponse } from "next/server";
import { loadMatchStandingsBundle } from "@/lib/load-match";
import { parsePlayersJson, scoreTeam } from "@/lib/scoring";

export async function GET(_req: Request, ctx: { params: Promise<{ matchId: string }> }) {
  try {
    const { matchId } = await ctx.params;

    const match = await loadMatchStandingsBundle(matchId);

    if (!match) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const pointsRows = match.points.map((p) => ({
      playerName: p.playerName,
      points: p.points,
    }));

    const byMember = new Map(match.teams.map((t) => [t.memberId, t]));

    const leaderboard = match.league.members.map((m) => {
      const t = byMember.get(m.id);
      if (!t) {
        return {
          memberId: m.id,
          memberName: m.name,
          total: 0,
          submissionId: null as string | null,
          hasTeam: false,
        };
      }
      const team = parsePlayersJson(t.playersJson);
      if (!team) {
        return {
          memberId: t.memberId,
          memberName: t.member.name,
          total: 0,
          submissionId: t.id,
          hasTeam: false,
        };
      }
      const { total } = scoreTeam(team, pointsRows);
      return {
        memberId: t.memberId,
        memberName: t.member.name,
        total,
        submissionId: t.id,
        hasTeam: team.players.filter(Boolean).length > 0,
      };
    });

    leaderboard.sort((a, b) => b.total - a.total);

    return NextResponse.json({
      match: { id: match.id, label: match.label },
      pointsLoaded: pointsRows.length,
      leaderboard,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Could not load leaderboard." }, { status: 500 });
  }
}
