import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { prioritizeSeriesMatches, type CricCurrentMatch } from "@/lib/cricapi";
import apiResponse from "@/app/api/cricket/current-matches/apiresponse.json";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export type ActiveRoom = {
  roomId: string;
  label: string;
  cricApiMatchId: string;
  playerCount: number;
};

/** Joinable game rooms for ongoing matches (≥1 player), newest first — capped at 3 for the home page. */
export async function GET() {
  try {
    const localMatches = prioritizeSeriesMatches(
      Array.isArray(apiResponse.matches) ? (apiResponse.matches as CricCurrentMatch[]) : []
    );

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
      Promise.resolve(localMatches),
    ]);

    const activeMatchIds = new Set(matches.filter((match) => !match.matchEnded).map((match) => match.id));

    const filteredRooms = roomRows.filter((room) => {
      const pc = typeof room.playerCount === "string" ? parseInt(room.playerCount, 10) : room.playerCount;
      if (pc < 1) return false;
      return activeMatchIds.has(room.cricApiMatchId);
    });

    const latestThree = filteredRooms.slice(0, 3);

    const result: ActiveRoom[] = latestThree.map((r) => ({
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
