import { NextResponse } from "next/server";
import { getOverallLeaderboardData, type OverallLeaderboardResponse } from "@/lib/overall-leaderboard";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export type { OverallLeaderboardResponse };

export async function GET() {
  try {
    const data = await getOverallLeaderboardData();
    return NextResponse.json(data as OverallLeaderboardResponse);
  } catch (e) {
    console.error("GET /api/game/overall:", e);
    return NextResponse.json(
      { participants: [], gameResults: [] } as OverallLeaderboardResponse,
      { status: 500 }
    );
  }
}
