import { query, queryOne } from "@/lib/db";

export type MemberRow = {
  id: string;
  leagueId: string;
  name: string;
  createdAt: Date;
};

export type MatchRow = {
  id: string;
  leagueId: string;
  label: string;
  matchDate: Date | null;
  cricApiMatchId: string | null;
  createdAt: Date;
};

export type PlayerMatchPointsRow = {
  id: string;
  matchId: string;
  playerName: string;
  points: number;
};

export type TeamSubmissionRow = {
  id: string;
  memberId: string;
  matchId: string;
  imagePath: string | null;
  ocrText: string | null;
  playersJson: string;
  updatedAt: Date;
  createdAt: Date;
  member: MemberRow;
};

/** Same shape as former Prisma `match` + includes used by live standings + leaderboard. */
export type MatchStandingsBundle = MatchRow & {
  points: PlayerMatchPointsRow[];
  teams: TeamSubmissionRow[];
  league: { members: MemberRow[] };
};

function num(v: unknown): number {
  if (typeof v === "number") return v;
  if (typeof v === "string") return parseFloat(v);
  return Number(v);
}

export async function loadMatchStandingsBundle(matchId: string): Promise<MatchStandingsBundle | null> {
  const match = await queryOne<MatchRow>(`SELECT * FROM "Match" WHERE id = $1`, [matchId]);
  if (!match) return null;

  const [pointsRaw, leagueMembers, teamSubs] = await Promise.all([
    query<Record<string, unknown>>(`SELECT * FROM "PlayerMatchPoints" WHERE "matchId" = $1`, [matchId]),
    query<MemberRow>(
      `SELECT * FROM "Member" WHERE "leagueId" = $1 ORDER BY "createdAt" ASC`,
      [match.leagueId]
    ),
    query<Record<string, unknown>>(`SELECT * FROM "TeamSubmission" WHERE "matchId" = $1`, [matchId]),
  ]);

  const memberIds = [...new Set(teamSubs.map((t) => String(t.memberId)))];
  const membersForSubs =
    memberIds.length === 0
      ? []
      : await query<MemberRow>(`SELECT * FROM "Member" WHERE id = ANY($1::text[])`, [memberIds]);

  const memberById = new Map(membersForSubs.map((m) => [m.id, m]));

  const points: PlayerMatchPointsRow[] = pointsRaw.map((p) => ({
    id: String(p.id),
    matchId: String(p.matchId),
    playerName: String(p.playerName),
    points: num(p.points),
  }));

  const teams: TeamSubmissionRow[] = teamSubs.map((t) => {
    const mid = String(t.memberId);
    const member = memberById.get(mid);
    if (!member) {
      throw new Error(`Member ${mid} missing for TeamSubmission`);
    }
    return {
      id: String(t.id),
      memberId: mid,
      matchId: String(t.matchId),
      imagePath: t.imagePath != null ? String(t.imagePath) : null,
      ocrText: t.ocrText != null ? String(t.ocrText) : null,
      playersJson: String(t.playersJson),
      updatedAt: t.updatedAt as Date,
      createdAt: t.createdAt as Date,
      member,
    };
  });

  return {
    ...match,
    points,
    teams,
    league: { members: leagueMembers },
  };
}
