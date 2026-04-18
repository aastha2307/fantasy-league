import { loadMatchStandingsBundle } from "@/lib/load-match";
import { parsePlayersJson, scoreTeam } from "@/lib/scoring";

export type LiveStandingsResult = {
  source: "manual" | "none";
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
  const match = await loadMatchStandingsBundle(matchId);

  if (!match) {
    throw new Error("Match not found");
  }

  let pointsRows: { playerName: string; points: number }[] = [];
  let source: LiveStandingsResult["source"] = "none";
  const apiError: string | null = null;
  let apiStatus: string | null = null;

  const manualRows = match.points.map((p) => ({ playerName: p.playerName, points: p.points }));

  // App runs in local-data mode: scores come from stored/manual points rows only.
  pointsRows = manualRows;
  source = manualRows.length ? "manual" : "none";

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
