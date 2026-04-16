/**
 * Dream11 team points from OCR:
 * 1) Prefer **sum of playing XI** player fantasy points (each row usually 0–280; team total is higher).
 * 2) Fallback: single **team total** heuristic (header / largest scored number).
 */

function roundPts(n: number): number {
  return Math.round(n * 100) / 100;
}

function isPlausibleFantasyTotal(n: number): boolean {
  return n >= 0 && n <= 2500;
}

/** Collapse spaces around decimal points so "569 . 5" still parses. */
export function normalizeOcrNumberText(raw: string): string {
  let s = raw.replace(/\r/g, "\n").replace(/,/g, "");
  s = s.replace(/(\d{1,4})\s*\.\s*(\d{1,2})\b/g, "$1.$2");
  s = s.replace(/(\d{1,4})\s+[Oo]\s*(\d{1,2})\b/g, "$1.$2");
  return s;
}

const PLAYER_POINTS_MAX = 280;
/** Typical Dream11 credit band — prefer last number on row as points when both exist. */
const CREDIT_MIN = 7;
const CREDIT_MAX = 13.5;

function lineLooksLikeCreditsOnly(line: string): boolean {
  const t = line.trim().toLowerCase();
  return /^\d+(?:\.\d+)?\s*cr(?:edit)?s?\s*$/i.test(t);
}

function looksLikePlayerRow(line: string): boolean {
  const t = line.trim();
  const low = t.toLowerCase();
  if (t.length < 4) return false;
  if (!/[a-zA-Z]{2,}/.test(t)) return false;
  if (lineLooksLikeCreditsOnly(line)) return false;
  if (/^(total|points?|pts|team|contest|rank|prize|deadline|my\s*teams?|leaderboard)/i.test(low)) return false;
  if (/(^|\s)(won|entry\s*fee|paytm|₹)/i.test(low)) return false;
  return true;
}

/**
 * On a Dream11 player row, fantasy points are usually the **last** plausible number
 * (credits like 9.0 cr often appear before points).
 */
function lastPlayingXiPointsOnLine(line: string): number | null {
  const low = line.toLowerCase();
  const nums: number[] = [];
  const re = /\b(\d{1,3}(?:\.\d{1,2})?)\b/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(line)) !== null) {
    const v = parseFloat(m[1]);
    if (v >= 0 && v <= PLAYER_POINTS_MAX) nums.push(v);
  }
  if (!nums.length) return null;

  for (let i = nums.length - 1; i >= 0; i--) {
    const v = nums[i];
    if (v > PLAYER_POINTS_MAX) continue;
    if (v >= CREDIT_MIN && v <= CREDIT_MAX && /cr/i.test(low) && nums.length >= 2 && i < nums.length - 1) {
      continue;
    }
    return v;
  }
  return nums[nums.length - 1];
}

/**
 * Sum fantasy points for up to **11** playing-XI rows (order = OCR line order).
 * Returns null if too few rows or sum implausible.
 */
export function sumDream11PlayingXiPointsFromOcr(raw: string): number | null {
  const normalized = normalizeOcrNumberText(raw);
  const lines = normalized.split("\n").map((l) => l.trim()).filter(Boolean);
  const rowPts: number[] = [];

  for (const line of lines) {
    if (rowPts.length >= 11) break;
    if (!looksLikePlayerRow(line)) continue;
    const p = lastPlayingXiPointsOnLine(line);
    if (p === null) continue;
    rowPts.push(roundPts(p));
  }

  if (rowPts.length < 6) return null;
  const sum = roundPts(rowPts.reduce((a, b) => a + b, 0));
  if (sum < 70 || sum > 1500) return null;
  return sum;
}

/** Score 0–10: higher = more likely team total for this line. */
function lineLooksLikeTeamTotalContext(line: string, value: number): number {
  let s = 0;
  const l = line.toLowerCase();

  if (lineLooksLikeCreditsOnly(line)) return -10;
  if (/credit\s*:/i.test(line) && !/point/i.test(l)) return -8;

  if (/(total|team|my\s*team|combined|overall)/i.test(l)) s += 5;
  if (/(fantasy\s*)?(points?|pts|score)/i.test(l)) s += 3;
  if (/rank|contest|prize|won|leaderboard|entry\s*fee/i.test(l)) s -= 4;

  if (/\b(c|vc|captain|vice|wk\b|bat\b|bowl\b|selected\s*by|played)/i.test(l)) s -= 5;
  if (/\b\d{1,2}\s*cr\b/i.test(l) && !/point/i.test(l)) s -= 3;

  if (/^[\d.\s]+$/.test(line.trim()) && value >= 250) s += 3;

  if (value >= 400 && value <= 950) s += 2;
  if (value >= 200 && value <= 399) s += 1;

  if (value > 0 && value <= 220 && /pts?|point|runs/i.test(l)) s -= 2;

  return s;
}

function extractDecimalsFromLine(line: string): number[] {
  const out: number[] = [];
  const re = /\b(\d{1,4})\s*\.\s*(\d{1,2})\b/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(line)) !== null) {
    const v = parseFloat(`${m[1]}.${m[2]}`);
    if (isPlausibleFantasyTotal(v)) out.push(v);
  }
  return out;
}

function inferFromMisreadInteger(n: number, line: string): number | null {
  if (/prize|rank|won|contest\s*fee|entry|paytm|₹|\$/i.test(line)) return null;
  if (!Number.isInteger(n)) return null;
  if (n < 3000 || n > 15000) return null;
  const v = n / 10;
  if (v >= 200 && v <= 1200) return roundPts(v);
  return null;
}

/** Fallback: one big “team total” number from the screenshot. */
export function extractDream11TotalPointsFromOcr(raw: string): number | null {
  const normalized = normalizeOcrNumberText(raw);
  const lines = normalized.split("\n").map((l) => l.trim()).filter(Boolean);

  type Cand = { v: number; score: number };
  const cands: Cand[] = [];

  const pushCand = (v: number, line: string) => {
    if (!isPlausibleFantasyTotal(v)) return;
    const score = lineLooksLikeTeamTotalContext(line, v);
    cands.push({ v: roundPts(v), score });
  };

  for (const line of lines) {
    if (lineLooksLikeCreditsOnly(line)) continue;

    for (const v of extractDecimalsFromLine(line)) {
      pushCand(v, line);
    }

    const tight = line.match(/\b(\d{1,4}\.\d{1,2})\b/g);
    if (tight) {
      for (const s of tight) {
        const v = parseFloat(s);
        pushCand(v, line);
      }
    }

    if (/^\d{1,4}(\.\d{1,2})?$/.test(line)) {
      const v = parseFloat(line);
      if (isPlausibleFantasyTotal(v) && v >= 1) {
        const y = Math.round(v);
        if (!line.includes(".") && y >= 1900 && y <= 2100) continue;
        pushCand(v, line);
      }
    }

    const intWords = line.match(/\b(\d{4,5})\b/g);
    if (intWords) {
      for (const s of intWords) {
        const n = parseInt(s, 10);
        const inferred = inferFromMisreadInteger(n, line);
        if (inferred != null) pushCand(inferred, line);
      }
    }
  }

  if (cands.length) {
    const maxScore = Math.max(...cands.map((c) => c.score));
    const bestTier = cands.filter((c) => c.score === maxScore);
    return bestTier.reduce((a, b) => (b.v > a.v ? b : a)).v;
  }

  const loose = normalized.match(/\b(\d{2,4}(?:\.\d{1,2})?)\b/g);
  if (loose) {
    const vals = loose
      .map((s) => parseFloat(s))
      .filter((v) => {
        if (!isPlausibleFantasyTotal(v) || v < 10) return false;
        if (Number.isInteger(v) && v >= 1900 && v <= 2100) return false;
        return true;
      });
    if (vals.length) return roundPts(Math.max(...vals));
  }

  return null;
}

/**
 * Best value for leaderboard: **sum of XI** when reliable, else **team total** heuristic.
 */
export function extractDream11PointsBestEffort(raw: string): number | null {
  const bySum = sumDream11PlayingXiPointsFromOcr(raw);
  if (bySum !== null) return bySum;
  return extractDream11TotalPointsFromOcr(raw);
}
