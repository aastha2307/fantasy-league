import { NextResponse } from "next/server";
import { computeGameRoomStandings } from "@/lib/game-room-standings";

export async function GET(_req: Request, ctx: { params: Promise<{ roomId: string }> }) {
  try {
    const { roomId } = await ctx.params;
    const result = await computeGameRoomStandings(roomId);
    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof Error && e.message === "Room not found") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    console.error(e);
    return NextResponse.json({ error: "Could not load leaderboard." }, { status: 500 });
  }
}
