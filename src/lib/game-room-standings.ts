import { queryOne, query } from "@/lib/db";

export type GameRoomStandingsResult = {
  source: "screenshot";
  room: { id: string; label: string; cricApiMatchId: string };
  leaderboard: {
    playerId: string;
    displayName: string;
    /** Same as ocrPoints when set; otherwise 0 */
    total: number;
    /** Fantasy points read from the Dream11 screenshot (null if not read) */
    ocrPoints: number | null;
    imagePath: string | null;
  }[];
  winner: { playerId: string; displayName: string; total: number } | null;
};

export async function computeGameRoomStandings(roomId: string): Promise<GameRoomStandingsResult> {
  const room = await queryOne<{
    id: string;
    label: string;
    cricApiMatchId: string;
    createdAt: Date;
  }>(`SELECT * FROM "GameRoom" WHERE id = $1`, [roomId]);

  if (!room) {
    throw new Error("Room not found");
  }

  const participants = await query<{
    id: string;
    displayName: string;
    ocrPoints: number | null;
    imagePath: string | null;
  }>(
    `SELECT id, "displayName", "ocrPoints", "imagePath" FROM "GamePlayer" WHERE "roomId" = $1 ORDER BY "createdAt" ASC`,
    [roomId]
  );

  const leaderboard: GameRoomStandingsResult["leaderboard"] = participants.map((p) => {
    const pts = p.ocrPoints;
    return {
      playerId: p.id,
      displayName: p.displayName,
      total: pts ?? 0,
      ocrPoints: pts,
      imagePath: p.imagePath,
    };
  });

  leaderboard.sort((a, b) => b.total - a.total);

  const withPoints = leaderboard.filter((r) => r.ocrPoints != null);
  withPoints.sort((a, b) => b.total - a.total);
  const top = withPoints[0];
  const winner = top
    ? { playerId: top.playerId, displayName: top.displayName, total: top.total }
    : null;

  return {
    source: "screenshot",
    room: {
      id: room.id,
      label: room.label,
      cricApiMatchId: room.cricApiMatchId,
    },
    leaderboard,
    winner,
  };
}
