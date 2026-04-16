import { normalizeName } from "@/lib/scoring";
import { fantasyBattingT20, fantasyBowlingT20, fantasyFieldingT20 } from "@/lib/fantasy-from-stats";

type Agg = { pts: number; displayName: string };

function add(map: Map<string, Agg>, displayName: string, delta: number) {
  const key = normalizeName(displayName);
  if (!key) return;
  const cur = map.get(key);
  if (cur) {
    cur.pts += delta;
  } else {
    map.set(key, { pts: delta, displayName: displayName.trim() });
  }
}

function readName(node: unknown): string | null {
  if (typeof node === "string") return node;
  if (node && typeof node === "object") {
    const o = node as Record<string, unknown>;
    if (typeof o.name === "string") return o.name;
    if (typeof o.shortname === "string") return o.shortname;
  }
  return null;
}

function num(v: unknown, fallback = 0): number {
  if (typeof v === "number" && !Number.isNaN(v)) return v;
  if (typeof v === "string") {
    const n = parseFloat(v);
    return Number.isNaN(n) ? fallback : n;
  }
  return fallback;
}

function parseDismissal(howOut: unknown, balls: number, runs: number): boolean {
  if (typeof howOut !== "string") return balls > 0 || runs > 0;
  const h = howOut.toLowerCase();
  if (h.includes("not out") || h === "did not bat" || h === "dnb") return false;
  return true;
}

function processBattingRow(row: Record<string, unknown>, map: Map<string, Agg>) {
  const name =
    readName(row.batsman) ??
    readName(row.batsmanName) ??
    readName(row.player) ??
    readName(row.name);
  if (!name) return;
  const runs = num(row.runs ?? row.r ?? row.run);
  const balls = num(row.balls ?? row.b ?? row.ballsFaced);
  const fours = num(row.fours ?? row["4s"]);
  const sixes = num(row.sixes ?? row["6s"]);
  const howOut = row.howOut ?? row.dismissal ?? row.out ?? row["dismissal"];
  const dismissed = parseDismissal(howOut, balls, runs);
  const pts = fantasyBattingT20({ runs, balls, fours, sixes, dismissed });
  add(map, name, pts);
}

function oversToDecimal(overs: unknown): number {
  if (typeof overs === "number") return overs;
  if (typeof overs !== "string") return 0;
  const parts = overs.split(".");
  const whole = parseInt(parts[0] ?? "0", 10) || 0;
  const balls = parseInt(parts[1] ?? "0", 10) || 0;
  return whole + balls / 6;
}

function processBowlingRow(row: Record<string, unknown>, map: Map<string, Agg>) {
  const name =
    readName(row.bowler) ??
    readName(row.bowlerName) ??
    readName(row.player) ??
    readName(row.name);
  if (!name) return;
  const wickets = num(row.wickets ?? row.w);
  const overs = oversToDecimal(row.overs);
  const runsConceded = num(row.runs ?? row.runsConceded);
  const maidens = num(row.maidens ?? row.maiden);
  const pts = fantasyBowlingT20({ wickets, overs, runsConceded, maidens });
  add(map, name, pts);
}

function processFieldingRow(row: Record<string, unknown>, map: Map<string, Agg>) {
  const name = readName(row.name) ?? readName(row.player) ?? readName(row.fielder);
  if (!name) return;
  const catches = num(row.catches ?? row.catch);
  const stumpings = num(row.stumpings ?? row.stumping);
  const runOuts = num(row.runOuts ?? row.runout ?? row.runouts);
  const pts = fantasyFieldingT20({
    catches,
    stumpings,
    runOuts,
  });
  if (pts !== 0) add(map, name, pts);
}

function rowHasBattingStats(row: Record<string, unknown>): boolean {
  return (
    "runs" in row ||
    "r" in row ||
    "run" in row ||
    "balls" in row ||
    "b" in row ||
    "ballsFaced" in row
  );
}

function rowHasBowlingStats(row: Record<string, unknown>): boolean {
  return "wickets" in row || "w" in row || "overs" in row || "o" in row;
}

function walkArrays(obj: unknown, map: Map<string, Agg>, depth: number) {
  if (depth > 18) return;
  if (!obj || typeof obj !== "object") return;
  if (Array.isArray(obj)) {
    for (const item of obj) {
      if (item && typeof item === "object" && !Array.isArray(item)) {
        const row = item as Record<string, unknown>;
        const keys = Object.keys(row);
        if (keys.some((k) => k.toLowerCase().includes("batsman")) && rowHasBattingStats(row)) {
          processBattingRow(row, map);
        } else if (keys.some((k) => k.toLowerCase().includes("bowler")) && rowHasBowlingStats(row)) {
          processBowlingRow(row, map);
        } else if ("catches" in row || "stumpings" in row || "runOuts" in row) {
          processFieldingRow(row, map);
        }
      }
      walkArrays(item, map, depth + 1);
    }
    return;
  }
  for (const v of Object.values(obj)) walkArrays(v, map, depth + 1);
}

function forEachInningScorecard(d: Record<string, unknown>, fn: (inn: Record<string, unknown>) => void) {
  const lists: unknown[] = [];
  for (const key of ["scorecard", "scoreCard", "innings", "inning"] as const) {
    const v = d[key];
    if (Array.isArray(v)) lists.push(...v);
  }
  for (const inn of lists) {
    if (inn && typeof inn === "object" && !Array.isArray(inn)) fn(inn as Record<string, unknown>);
  }
}

/**
 * Turns a CricAPI / Cricket Data scorecard JSON payload into per-player fantasy points.
 */
export function scorecardJsonToPlayerPoints(payload: unknown): { playerName: string; points: number }[] {
  const map = new Map<string, Agg>();

  if (payload && typeof payload === "object") {
    const root = payload as Record<string, unknown>;
    const data = root.data ?? root;
    if (data && typeof data === "object") {
      const d = data as Record<string, unknown>;
      const processInning = (inning: Record<string, unknown>) => {
        const batting = inning.batting;
        const bowling = inning.bowling;
        if (Array.isArray(batting)) {
          for (const row of batting) {
            if (row && typeof row === "object") processBattingRow(row as Record<string, unknown>, map);
          }
        }
        if (Array.isArray(bowling)) {
          for (const row of bowling) {
            if (row && typeof row === "object") processBowlingRow(row as Record<string, unknown>, map);
          }
        }
      };

      forEachInningScorecard(d, processInning);

      if (Array.isArray(d.batting)) {
        for (const row of d.batting) {
          if (row && typeof row === "object") processBattingRow(row as Record<string, unknown>, map);
        }
      }
      if (Array.isArray(d.bowling)) {
        for (const row of d.bowling) {
          if (row && typeof row === "object") processBowlingRow(row as Record<string, unknown>, map);
        }
      }
    }
  }

  if (map.size === 0) walkArrays(payload, map, 0);

  return [...map.values()].map((v) => ({ playerName: v.displayName, points: Math.round(v.pts * 100) / 100 }));
}
