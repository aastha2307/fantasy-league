import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fetchIplSeriesMatches } from "@/lib/cricapi";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export type ActiveRoom = {
  roomId: string;
  label: string;
  cricApiMatchId: string;
  playerCount: number;
};

/** Returns joinable game rooms with at least one participant, ordered newest first. */
export async function GET() {
  try {
    const [rooms, matches] = await Promise.all([
      prisma.gameRoom.findMany({
        include: { _count: { select: { participants: true } } },
        orderBy: { createdAt: "desc" },
      }),
      fetchIplSeriesMatches().catch(() => null),
    ]);

    const activeMatchIds = matches
      ? new Set(matches.filter((match) => !match.matchEnded).map((match) => match.id))
      : null;

    const filteredRooms = rooms.filter((room) => {
      if (room._count.participants < 1) return false;
      if (!activeMatchIds) return true;
      return activeMatchIds.has(room.cricApiMatchId);
    });

    const result: ActiveRoom[] = filteredRooms.map((r) => ({
      roomId: r.id,
      label: r.label,
      cricApiMatchId: r.cricApiMatchId,
      playerCount: r._count.participants,
    }));

    return NextResponse.json({ rooms: result });
  } catch (e) {
    console.error("GET /api/game/active:", e);
    return NextResponse.json({ error: "Could not load active games.", rooms: [] }, { status: 500 });
  }
}
