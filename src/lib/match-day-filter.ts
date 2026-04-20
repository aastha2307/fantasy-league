import type { MatchScheduleFields } from "@/lib/format-match-date";

export type MatchWithSchedule = MatchScheduleFields & { id: string };

const TZ = "Asia/Kolkata";

/** Calendar YYYY-MM-DD in IST for a fixture. */
export function matchDateKeyIst(m: MatchScheduleFields): string | null {
  if (m.date && /^\d{4}-\d{2}-\d{2}$/.test(m.date)) {
    return m.date;
  }
  if (m.dateTimeGMT) {
    const t = Date.parse(m.dateTimeGMT);
    if (Number.isNaN(t)) return null;
    return new Date(t).toLocaleDateString("en-CA", { timeZone: TZ });
  }
  return null;
}

export function getIstTodayAndYesterdayKeys(): { today: string; yesterday: string } {
  const now = new Date();
  const today = now.toLocaleDateString("en-CA", { timeZone: TZ });
  const prior = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const yesterday = prior.toLocaleDateString("en-CA", { timeZone: TZ });
  return { today, yesterday };
}

/** Keep only fixtures scheduled on IST today or IST yesterday. */
export function filterMatchesToTodayAndYesterdayIst<T extends MatchWithSchedule>(matches: T[]): T[] {
  const { today, yesterday } = getIstTodayAndYesterdayKeys();
  const allow = new Set([today, yesterday]);
  return matches.filter((m) => {
    const key = matchDateKeyIst(m);
    return key !== null && allow.has(key);
  });
}

function sortKeyMs(m: MatchWithSchedule): number {
  const s = m.dateTimeGMT || m.date || "";
  const t = Date.parse(s);
  return Number.isNaN(t) ? 0 : t;
}

/** Live first, then newest-by-schedule first (latest fixture at top). */
export function sortMatchesForDisplay<T extends MatchWithSchedule & { matchStarted?: boolean; matchEnded?: boolean }>(
  matches: T[]
): T[] {
  const live = matches.filter((m) => m.matchStarted && !m.matchEnded);
  const rest = matches
    .filter((m) => !(m.matchStarted && !m.matchEnded))
    .sort((a, b) => sortKeyMs(b) - sortKeyMs(a));
  return [...live, ...rest];
}
