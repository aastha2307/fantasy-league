import { query } from "@/lib/db";
import { TRACKED_PLAYERS, type TrackedPlayer } from "@/lib/tracked-players";

type ParticipantStanding = {
  key: string;
  displayName: string;
  personName: string;
  matchesPlayed: number;
  wins: number;
  rewardPoints: number;
  totalPoints: number;
  avgPoints: number;
};

export type OverallLeaderboardResponse = {
  participants: ParticipantStanding[];
  gameResults: {
    roomId: string;
    label: string;
    first: {
      displayName: string;
      personName: string;
      points: number;
      rewardPoints: number;
    };
    second: {
      displayName: string;
      personName: string;
      points: number;
      rewardPoints: number;
    } | null;
  }[];
};

function normalizeName(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

const participantByAlias = new Map<string, TrackedPlayer>();
for (const p of TRACKED_PLAYERS) {
  for (const alias of p.aliases) {
    participantByAlias.set(normalizeName(alias), p);
  }
}

/** Shared server-only loader for the overall leaderboard API and page. */
export async function getOverallLeaderboardData(): Promise<OverallLeaderboardResponse> {
  const rooms = await query<{ id: string; label: string; cricApiMatchId: string; createdAt: Date }>(
    `SELECT id, label, "cricApiMatchId", "createdAt" FROM "GameRoom" ORDER BY "createdAt" ASC`
  );
  const roomIds = rooms.map((r) => r.id);
  const participantsRaw =
    roomIds.length === 0
      ? []
      : await query<{
          roomId: string;
          displayName: string;
          ocrPoints: number | null;
          createdAt: Date;
        }>(
          `SELECT "roomId", "displayName", "ocrPoints", "createdAt" FROM "GamePlayer" WHERE "roomId" = ANY($1::text[])`,
          [roomIds]
        );

  const byRoom = new Map<string, { displayName: string; ocrPoints: number | null; createdAt: Date }[]>();
  for (const p of participantsRaw) {
    const list = byRoom.get(p.roomId) ?? [];
    list.push({
      displayName: p.displayName,
      ocrPoints: p.ocrPoints,
      createdAt: p.createdAt,
    });
    byRoom.set(p.roomId, list);
  }

  const roomsWithParticipants = rooms.map((r) => ({
    ...r,
    participants: byRoom.get(r.id) ?? [],
  }));

  const standingMap = new Map<string, ParticipantStanding>();
  for (const p of TRACKED_PLAYERS) {
    standingMap.set(p.key, {
      key: p.key,
      displayName: p.displayName,
      personName: p.personName,
      matchesPlayed: 0,
      wins: 0,
      rewardPoints: 0,
      totalPoints: 0,
      avgPoints: 0,
    });
  }

  const gameResults: OverallLeaderboardResponse["gameResults"] = [];

  for (const room of roomsWithParticipants) {
    const tracked = room.participants
      .map((x) => ({
        participant: participantByAlias.get(normalizeName(x.displayName)),
        ocrPoints: x.ocrPoints ?? 0,
        createdAt: x.createdAt,
      }))
      .filter(
        (x): x is { participant: TrackedPlayer; ocrPoints: number; createdAt: Date } =>
          !!x.participant && x.ocrPoints != null
      );

    if (tracked.length === 0) continue;

    for (const row of tracked) {
      const s = standingMap.get(row.participant.key);
      if (!s) continue;
      s.matchesPlayed += 1;
      s.totalPoints = Math.round((s.totalPoints + row.ocrPoints) * 100) / 100;
    }

    tracked.sort((a, b) => {
      if (b.ocrPoints !== a.ocrPoints) return b.ocrPoints - a.ocrPoints;
      return a.createdAt.getTime() - b.createdAt.getTime();
    });

    const winner = tracked[0];
    const ws = standingMap.get(winner.participant.key);
    if (ws) {
      ws.wins += 1;
      ws.rewardPoints += 120;
    }

    const runnerUp = tracked[1] ?? null;
    if (runnerUp) {
      const rs = standingMap.get(runnerUp.participant.key);
      if (rs) rs.rewardPoints += 60;
    }

    gameResults.push({
      roomId: room.id,
      label: room.label,
      first: {
        displayName: winner.participant.displayName,
        personName: winner.participant.personName,
        points: winner.ocrPoints,
        rewardPoints: 120,
      },
      second: runnerUp
        ? {
            displayName: runnerUp.participant.displayName,
            personName: runnerUp.participant.personName,
            points: runnerUp.ocrPoints,
            rewardPoints: 60,
          }
        : null,
    });
  }

  const participants = Array.from(standingMap.values()).map((x) => ({
    ...x,
    avgPoints: x.matchesPlayed > 0 ? Math.round((x.totalPoints / x.matchesPlayed) * 100) / 100 : 0,
  }));

  participants.sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    if (b.rewardPoints !== a.rewardPoints) return b.rewardPoints - a.rewardPoints;
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
    if (b.avgPoints !== a.avgPoints) return b.avgPoints - a.avgPoints;
    return a.displayName.localeCompare(b.displayName);
  });

  gameResults.reverse();

  return { participants, gameResults };
}
