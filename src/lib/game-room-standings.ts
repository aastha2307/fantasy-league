import { prisma } from "@/lib/prisma";

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
  const room = await prisma.gameRoom.findUnique({
    where: { id: roomId },
    include: { participants: { orderBy: { createdAt: "asc" } } },
  });

  if (!room) {
    throw new Error("Room not found");
  }

  const leaderboard: GameRoomStandingsResult["leaderboard"] = room.participants.map((p) => {
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
