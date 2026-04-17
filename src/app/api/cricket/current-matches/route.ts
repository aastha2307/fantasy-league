import { NextResponse } from "next/server";
import type { CricCurrentMatch } from "@/lib/cricapi";
import { filterMatchesToTodayAndYesterdayIst, sortMatchesForDisplay } from "@/lib/match-day-filter";
import apiResponse from "./apiresponse.json";

/** IPL fixtures from bundled `apiresponse.json`; only IST calendar today and yesterday. */
export async function GET() {
  try {
    const raw = Array.isArray(apiResponse.matches)
      ? (apiResponse.matches as CricCurrentMatch[])
      : [];
    const filtered = filterMatchesToTodayAndYesterdayIst(raw);
    const matches = sortMatchesForDisplay(filtered);
    return NextResponse.json({ matches, seriesFilter: "IPL" as const });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Could not load matches.";
    return NextResponse.json({ error: msg, matches: [] as unknown[], seriesFilter: "IPL" as const }, { status: 200 });
  }
}
