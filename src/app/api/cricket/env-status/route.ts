import { NextResponse } from "next/server";
import { getAppUrlFromEnv, getAppUrlFromRequest } from "@/lib/app-url";

/**
 * Dev helper: confirms whether the server sees an API key (never returns the key).
 * Open: GET /api/cricket/env-status
 */
export async function GET(request: Request) {
  const raw =
    process.env.CRICKET_API_KEY ?? process.env.CRICAPI_KEY ?? process.env.CRICKET_DATA_API_KEY;
  const trimmed =
    typeof raw === "string"
      ? raw.trim().replace(/^["']|["']$/g, "").trim()
      : "";

  const appUrlEnv = getAppUrlFromEnv();
  const appUrlResolved = getAppUrlFromRequest(request);

  return NextResponse.json({
    keyLoaded: trimmed.length > 0,
    keyLength: trimmed.length,
    appUrlEnv,
    appUrlResolved,
    hint: trimmed.length
      ? "Server sees a key. If Cricket Data still fails, the key may be invalid or expired — check https://www.cricapi.com/"
      : "No key visible to the server. Put CRICKET_API_KEY in ipl-fantasy/.env or .env.local and restart `npm run dev` (run the command from the ipl-fantasy directory).",
  });
}
