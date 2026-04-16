import { prisma } from "@/lib/prisma";
import { fetchMatchInfo, fetchMatchScorecard } from "@/lib/cricapi";
import { scorecardJsonToPlayerPoints } from "@/lib/scorecard-to-points";
import { parsePlayersJson, scoreTeam } from "@/lib/scoring";

export type LiveStandingsResult = {
  source: "live" | "manual" | "none";
  cricApiMatchId: string | null;
  apiStatus: string | null;
  apiError: string | null;
  pointsRows: { playerName: string; points: number }[];
  leaderboard: {
    memberId: string;
    memberName: string;
    total: number;
    submissionId: string | null;
    hasTeam: boolean;
    players: {
      name: string;
      role: "c" | "vc" | "p";
      basePoints: number;
      points: number;
      matched: boolean;
    }[];
  }[];
  winner: { memberId: string; memberName: string; total: number } | null;
};

export async function computeLiveStandings(matchId: string): Promise<LiveStandingsResult> {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      points: true,
      teams: { include: { member: true } },
      league: { include: { members: true } },
    },
  });

  if (!match) {
    throw new Error("Match not found");
  }

  let pointsRows: { playerName: string; points: number }[] = [];
  let source: LiveStandingsResult["source"] = "none";
  let apiError: string | null = null;
  let apiStatus: string | null = null;

  const manualRows = match.points.map((p) => ({ playerName: p.playerName, points: p.points }));

  if (match.cricApiMatchId && process.env.CRICKET_API_KEY) {
    try {
      const raw = await fetchMatchScorecard(match.cricApiMatchId);
      pointsRows = scorecardJsonToPlayerPoints(raw);
      if (pointsRows.length === 0) {
        apiError =
          "Live scorecard returned no player rows. The API layout may have changed, or the match id is wrong.";
        pointsRows = manualRows;
        source = manualRows.length ? "manual" : "none";
      } else {
        source = "live";
        const info = await fetchMatchInfo(match.cricApiMatchId);
        apiStatus = info?.status ?? null;
      }
    } catch (e) {
      apiError = e instanceof Error ? e.message : "Live fetch failed";
      pointsRows = manualRows;
      source = manualRows.length ? "manual" : "none";
    }
  } else {
    pointsRows = manualRows;
    source = manualRows.length ? "manual" : "none";
    if (match.cricApiMatchId && !process.env.CRICKET_API_KEY) {
      apiError = "CRICKET_API_KEY is not set on the server.";
    }
  }

  const byMember = new Map(match.teams.map((t) => [t.memberId, t]));

  const leaderboard: LiveStandingsResult["leaderboard"] = match.league.members.map((m) => {
    const t = byMember.get(m.id);
    if (!t) {
      return {
        memberId: m.id,
        memberName: m.name,
        total: 0,
        submissionId: null,
        hasTeam: false,
        players: [],
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
        players: [],
      };
    }
    const scored = scoreTeam(team, pointsRows);
    return {
      memberId: t.memberId,
      memberName: t.member.name,
      total: scored.total,
      submissionId: t.id,
      hasTeam: team.players.filter(Boolean).length > 0,
      players: scored.breakdown.map((b) => ({
        name: b.name,
        role: b.role,
        basePoints: b.basePoints,
        points: b.points,
        matched: b.matched,
      })),
    };
  });

  leaderboard.sort((a, b) => b.total - a.total);

  const contenders = leaderboard.filter((r) => r.hasTeam);
  contenders.sort((a, b) => b.total - a.total);
  const top = contenders[0];
  const winner = top
    ? {
        memberId: top.memberId,
        memberName: top.memberName,
        total: top.total,
      }
    : null;

  return {
    source,
    cricApiMatchId: match.cricApiMatchId ?? null,
    apiStatus,
    apiError,
    pointsRows,
    leaderboard,
    winner,
  };
}
