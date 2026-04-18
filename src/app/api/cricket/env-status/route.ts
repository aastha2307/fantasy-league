import { NextResponse } from "next/server";
import { getAppUrlFromEnv, getAppUrlFromRequest } from "@/lib/app-url";

/**
 * Dev helper: confirms current app URL resolution and local-data mode status.
 * Open: GET /api/cricket/env-status
 */
export async function GET(request: Request) {
  const appUrlEnv = getAppUrlFromEnv();
  const appUrlResolved = getAppUrlFromRequest(request);

  return NextResponse.json({
    mode: "local-json",
    appUrlEnv,
    appUrlResolved,
    hint:
      "Live Cricket API key is not required. App uses bundled local match JSON and stored points rows.",
  });
}
