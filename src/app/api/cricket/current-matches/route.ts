import { NextResponse } from "next/server";
import { fetchIplSeriesMatches } from "@/lib/cricapi";

/** IPL fixtures only (series_info + IPL series id). Query ?all=1 not supported — list is always IPL-focused. */
export async function GET() {
  try {
    const matches = await fetchIplSeriesMatches();
    return NextResponse.json({ matches, seriesFilter: "IPL" as const });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Could not load matches.";
    return NextResponse.json({ error: msg, matches: [] as unknown[], seriesFilter: "IPL" as const }, { status: 200 });
  }
}
