import { NextResponse } from "next/server";
import { computeLiveStandings } from "@/lib/live-match";

export async function GET(_req: Request, ctx: { params: Promise<{ matchId: string }> }) {
  try {
    const { matchId } = await ctx.params;
    const result = await computeLiveStandings(matchId);
    return NextResponse.json(result);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Could not load live standings." }, { status: 500 });
  }
}
