import { NextResponse } from "next/server";
import { query } from "@/lib/db";
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
    const [roomRows, matches] = await Promise.all([
      query<{
        id: string;
        label: string;
        cricApiMatchId: string;
        playerCount: string | number;
      }>(
        `SELECT gr.id, gr.label, gr."cricApiMatchId",
                (SELECT COUNT(*)::int FROM "GamePlayer" gp WHERE gp."roomId" = gr.id) AS "playerCount"
         FROM "GameRoom" gr
         ORDER BY gr."createdAt" DESC`
      ),
      fetchIplSeriesMatches().catch(() => null),
    ]);

    const activeMatchIds = matches
      ? new Set(matches.filter((match) => !match.matchEnded).map((match) => match.id))
      : null;

    const filteredRooms = roomRows.filter((room) => {
      const pc = typeof room.playerCount === "string" ? parseInt(room.playerCount, 10) : room.playerCount;
      if (pc < 1) return false;
      if (!activeMatchIds) return true;
      return activeMatchIds.has(room.cricApiMatchId);
    });

    const result: ActiveRoom[] = filteredRooms.map((r) => ({
      roomId: r.id,
      label: r.label,
      cricApiMatchId: r.cricApiMatchId,
      playerCount: typeof r.playerCount === "string" ? parseInt(r.playerCount, 10) : r.playerCount,
    }));

    return NextResponse.json({ rooms: result });
  } catch (e) {
    console.error("GET /api/game/active:", e);
    return NextResponse.json({ error: "Could not load active games.", rooms: [] }, { status: 500 });
  }
}
