const BASE = "https://api.cricapi.com/v1";

export type CricCurrentMatch = {
  id: string;
  name: string;
  status: string;
  matchType?: string;
  /** Local calendar date from API e.g. `2026-04-11` */
  date?: string;
  dateTimeGMT?: string;
  matchStarted?: boolean;
  matchEnded?: boolean;
};

/** Default: Indian Premier League (Cricket Data series id). Override with IPL_SERIES_ID in .env */
export const DEFAULT_IPL_SERIES_ID = "87c62aac-bc3c-4738-ab93-19da0690488f";

function getIplSeriesId(): string {
  const raw = process.env.IPL_SERIES_ID ?? DEFAULT_IPL_SERIES_ID;
  return String(raw).trim().replace(/^["']|["']$/g, "").trim() || DEFAULT_IPL_SERIES_ID;
}

/**
 * Reads API key from the server environment only.
 * Use exactly `CRICKET_API_KEY` in `.env` or `.env.local` at the project root (`ipl-fantasy/`),
 * then restart `npm run dev`. Quotes and surrounding spaces are tolerated.
 */
function getKey(): string {
  const raw =
    process.env.CRICKET_API_KEY ?? process.env.CRICAPI_KEY ?? process.env.CRICKET_DATA_API_KEY;
  if (raw === undefined || raw === null) {
    throw new Error(
      "CRICKET_API_KEY is not set on the server. Add it to .env or .env.local in the ipl-fantasy folder (not the parent folder), then restart the dev server."
    );
  }
  let k = String(raw).trim();
  if (
    (k.startsWith('"') && k.endsWith('"')) ||
    (k.startsWith("'") && k.endsWith("'"))
  ) {
    k = k.slice(1, -1).trim();
  }
  if (!k) {
    throw new Error(
      "CRICKET_API_KEY is empty after trimming. Check .env for typos or a blank value."
    );
  }
  return k;
}

export async function cricApiFetch<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(`${BASE}${path.startsWith("/") ? path : `/${path}`}`);
  url.searchParams.set("apikey", getKey());
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  const res = await fetch(url.toString(), {
    cache: "no-store",
    signal: AbortSignal.timeout(25_000),
  });
  const json = (await res.json()) as Record<string, unknown>;
  if (!res.ok) {
    throw new Error(typeof json.reason === "string" ? json.reason : `HTTP ${res.status}`);
  }
  if (json.status === "failure") {
    throw new Error(typeof json.reason === "string" ? json.reason : "CricAPI failure");
  }
  return json as T;
}

export async function fetchCurrentMatches(offset = 0): Promise<CricCurrentMatch[]> {
  type Resp = { data?: CricCurrentMatch[] | { matches?: CricCurrentMatch[] } };
  const j = await cricApiFetch<Resp>("/currentMatches", { offset: String(offset) });
  const d = j.data;
  if (Array.isArray(d)) return d;
  if (d && typeof d === "object" && Array.isArray(d.matches)) return d.matches;
  return [];
}

type SeriesMatchRaw = {
  id?: string;
  name?: string;
  status?: string;
  matchType?: string;
  date?: string;
  dateTimeGMT?: string;
  matchStarted?: boolean;
  matchEnded?: boolean;
};

function normalizeSeriesMatch(m: SeriesMatchRaw): CricCurrentMatch | null {
  if (!m?.id || !m?.name) return null;
  return {
    id: m.id,
    name: m.name,
    status: String(m.status ?? ""),
    matchType: m.matchType,
    date: typeof m.date === "string" ? m.date : undefined,
    dateTimeGMT: m.dateTimeGMT,
    matchStarted: m.matchStarted,
    matchEnded: m.matchEnded,
  };
}

/** Parse date for sorting; invalid dates sort last. */
function matchTimeMs(m: CricCurrentMatch): number {
  const s = m.dateTimeGMT || m.date || "";
  const t = Date.parse(s);
  return Number.isNaN(t) ? 0 : t;
}

/**
 * IPL (or any series) fixtures from `series_info`: live first, then upcoming, then recently finished.
 */
export function prioritizeSeriesMatches(matches: CricCurrentMatch[]): CricCurrentMatch[] {
  const live = matches.filter((m) => m.matchStarted && !m.matchEnded);
  const upcoming = matches
    .filter((m) => !m.matchStarted && !m.matchEnded)
    .sort((a, b) => matchTimeMs(a) - matchTimeMs(b));
  const done = matches
    .filter((m) => m.matchEnded)
    .sort((a, b) => matchTimeMs(b) - matchTimeMs(a))
    .slice(0, 12);
  const seen = new Set<string>();
  const out: CricCurrentMatch[] = [];
  for (const x of [...live, ...upcoming, ...done]) {
    if (seen.has(x.id)) continue;
    seen.add(x.id);
    out.push(x);
  }
  return out;
}

/**
 * All matches in a series (e.g. IPL) via Cricket Data `series_info`, with live/upcoming/recent ordering.
 */
export async function fetchMatchesForSeries(seriesId: string): Promise<CricCurrentMatch[]> {
  const normalized = await fetchMatchesForSeriesAll(seriesId);
  return prioritizeSeriesMatches(normalized);
}

/**
 * Full `matchList` for a series (no reordering/slicing). Used for client-side day filtering + session cache.
 */
export async function fetchMatchesForSeriesAll(seriesId: string): Promise<CricCurrentMatch[]> {
  type Resp = {
    data?: {
      matchList?: SeriesMatchRaw[];
    };
  };
  const j = await cricApiFetch<Resp>("/series_info", { id: seriesId, offset: "0" });
  const list = j.data?.matchList;
  if (!Array.isArray(list)) return [];
  return list.map(normalizeSeriesMatch).filter((x): x is CricCurrentMatch => x !== null);
}

/**
 * Full IPL series list for the home page (uses IPL_SERIES_ID env or default).
 */
export async function fetchIplSeriesMatches(): Promise<CricCurrentMatch[]> {
  return fetchMatchesForSeriesAll(getIplSeriesId());
}

export async function fetchMatchScorecard(matchId: string): Promise<unknown> {
  type Resp = { data?: unknown };
  const j = await cricApiFetch<Resp>("/match_scorecard", { id: matchId });
  return j.data ?? j;
}

export async function fetchMatchInfo(matchId: string): Promise<{ status?: string; name?: string } | null> {
  try {
    type Resp = { data?: { status?: string; name?: string } };
    const j = await cricApiFetch<Resp>("/match_info", { id: matchId });
    return j.data ?? null;
  } catch {
    return null;
  }
}
