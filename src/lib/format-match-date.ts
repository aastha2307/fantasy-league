export type MatchScheduleFields = {
  date?: string;
  dateTimeGMT?: string;
};

/** List row: date/time in IST when kickoff time exists, else calendar date. */
export function formatMatchScheduleLabel(m: MatchScheduleFields): string {
  const src = m.dateTimeGMT || m.date;
  if (!src) return "";
  const t = Date.parse(src);
  if (Number.isNaN(t)) return m.date ?? "";
  const d = new Date(t);
  const hasTime = Boolean(m.dateTimeGMT?.includes("T"));
  try {
    return new Intl.DateTimeFormat("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
      ...(hasTime
        ? { hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" }
        : { timeZone: "UTC" }),
    }).format(d);
  } catch {
    return m.date ?? src;
  }
}
