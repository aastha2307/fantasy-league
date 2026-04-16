export type TeamPlayers = {
  players: string[];
  captain: string;
  viceCaptain: string;
};

export function normalizeName(s: string): string {
  return s.trim().replace(/\s+/g, " ").toLowerCase();
}

function lastNameToken(s: string): string {
  const parts = s.trim().split(/\s+/).filter(Boolean);
  return parts[parts.length - 1] ?? "";
}

function bestPointsForPlayer(
  normalizedPick: string,
  pointsMap: Map<string, number>
): { points: number; matchedKey: string | null } {
  if (!normalizedPick) return { points: 0, matchedKey: null };
  if (pointsMap.has(normalizedPick)) {
    const k = normalizedPick;
    return { points: pointsMap.get(k)!, matchedKey: k };
  }
  for (const [key, val] of pointsMap) {
    if (key.includes(normalizedPick) || normalizedPick.includes(key)) {
      return { points: val, matchedKey: key };
    }
  }
  const lp = lastNameToken(normalizedPick);
  if (lp.length >= 3) {
    const hits: [string, number][] = [];
    for (const [key, val] of pointsMap) {
      if (lastNameToken(key) === lp) hits.push([key, val]);
    }
    if (hits.length === 1) {
      return { points: hits[0][1], matchedKey: hits[0][0] };
    }
  }
  return { points: 0, matchedKey: null };
}

export function scoreTeam(
  team: TeamPlayers,
  pointsRows: { playerName: string; points: number }[]
): {
  total: number;
  breakdown: {
    name: string;
    role: "c" | "vc" | "p";
    basePoints: number;
    points: number;
    matched: boolean;
  }[];
} {
  const pointsMap = new Map<string, number>();
  for (const row of pointsRows) {
    pointsMap.set(normalizeName(row.playerName), row.points);
  }

  const cap = normalizeName(team.captain);
  const vc = normalizeName(team.viceCaptain);

  const breakdown: {
    name: string;
    role: "c" | "vc" | "p";
    basePoints: number;
    points: number;
    matched: boolean;
  }[] = [];

  let total = 0;
  for (const raw of team.players) {
    const n = normalizeName(raw);
    if (!n) continue;
    const { points, matchedKey } = bestPointsForPlayer(n, pointsMap);
    const role: "c" | "vc" | "p" =
      n === cap ? "c" : n === vc ? "vc" : "p";
    const mult = role === "c" ? 2 : role === "vc" ? 1.5 : 1;
    const contrib = points * mult;
    total += contrib;
    breakdown.push({
      name: raw.trim(),
      role,
      basePoints: points,
      points: contrib,
      matched: matchedKey !== null,
    });
  }

  return { total, breakdown };
}

export function parsePlayersJson(raw: string): TeamPlayers | null {
  try {
    const v = JSON.parse(raw) as TeamPlayers;
    if (!Array.isArray(v.players)) return null;
    return {
      players: v.players.map(String),
      captain: String(v.captain ?? ""),
      viceCaptain: String(v.viceCaptain ?? ""),
    };
  } catch {
    return null;
  }
}
