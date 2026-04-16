import { normalizeName, type TeamPlayers } from "@/lib/scoring";

const ROLE_TOKENS = new Set([
  "wk",
  "bat",
  "ar",
  "bowl",
  "bowler",
  "batsman",
  "all",
  "rounder",
  "credits",
  "credit",
  "players",
  "playing",
  "xi",
  "team",
  "dream11",
  "super",
  "contest",
  "match",
  "live",
  "upcoming",
  "captain",
  "vice",
  "vc",
  "substitute",
  "bench",
]);

const TEAM_CODES = new Set([
  "csk",
  "mi",
  "rcb",
  "kkr",
  "rr",
  "srh",
  "dc",
  "gt",
  "lsg",
  "pbks",
  "ind",
  "aus",
  "eng",
  "nz",
  "sa",
  "wi",
  "ban",
  "sl",
  "pak",
  "afg",
]);

function tidyLine(line: string): string {
  return line.replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
}

/** Trim OCR noise around a captured player line. */
function sanitizePlayerDisplay(raw: string): string {
  let s = tidyLine(raw);
  s = s.replace(/^[|•·\s]+|[|•·\s]+$/g, "");
  s = s.replace(/\s*\(\s*(wk|bat|ar|bowl|bowler|batsman)\s*\)\s*$/i, "").trim();
  s = s.replace(/\s+/g, " ").trim();
  return s;
}

function stripMarkers(line: string): { text: string; marker?: "c" | "vc" } {
  let s = tidyLine(line);
  let marker: "c" | "vc" | undefined;

  if (/\(\s*VC\s*\)/i.test(s) || /\bVC\b(?!\w)/i.test(s)) {
    marker = "vc";
    s = s.replace(/\(\s*VC\s*\)/gi, "").replace(/\bVC\b/gi, "").trim();
  }
  if (/\(\s*C\s*\)/i.test(s) && marker !== "vc") {
    marker = "c";
    s = s.replace(/\(\s*C\s*\)/gi, "").trim();
  }
  s = s.replace(/\s*[©]\s*$/u, "").trim();
  s = s.replace(/\s+\bC\s*$/i, "").trim();
  if (!marker && /\bV\.?C\.?\b/i.test(s)) {
    marker = "vc";
    s = s.replace(/\bV\.?C\.?\b/gi, "").trim();
  }
  return { text: s, marker };
}

function isCreditOrPointsLine(line: string): boolean {
  const t = tidyLine(line);
  if (/^[\d.]+\s*(cr|Pts?)?$/i.test(t)) return true;
  if (/^\d{1,2}\.\d\s*$/.test(t)) return true;
  if (/^Pts?$/i.test(t)) return true;
  return false;
}

function isJunkLine(line: string): boolean {
  const t = tidyLine(line);
  if (!t) return true;
  const lower = t.toLowerCase();
  if (t.length <= 2) return true;
  if (ROLE_TOKENS.has(lower)) return true;
  if (TEAM_CODES.has(lower) && t.length <= 4) return true;
  if (/^(wk|bat|ar|bowl)$/i.test(t)) return true;
  if (/^dream\s*11/i.test(lower)) return true;
  if (/^select\s+/i.test(t)) return true;
  if (/^total\s+credits?/i.test(t)) return true;
  if (/^deadline/i.test(t)) return true;
  if (/^powerplay|^overs|^runs|^wickets/i.test(t)) return true;
  return false;
}

function looksLikePersonName(line: string): boolean {
  const t = tidyLine(line);
  if (t.length < 4 || t.length > 48) return false;
  if (isCreditOrPointsLine(t)) return false;
  if (/^[\d\s.,:%$₹-]+$/.test(t)) return false;

  const words = t.split(/\s+/).filter(Boolean);
  if (words.length < 2) return false;

  let alphaTokens = 0;
  for (const w of words) {
    const letters = w.replace(/[^a-zA-Z]/g, "");
    if (letters.length >= 2) alphaTokens++;
  }
  if (alphaTokens < 2) return false;

  const digits = (t.match(/\d/g) ?? []).length;
  if (digits / t.length > 0.35) return false;

  const letters = (t.match(/[a-zA-Z]/g) ?? []).length;
  if (letters / t.length < 0.45) return false;

  return true;
}

/**
 * Heuristic extraction of 11 players + C/VC from Dream11 screenshot OCR text.
 */
export function extractTeamPlayersFromOcr(raw: string): TeamPlayers {
  const text = raw.replace(/\r/g, "\n");
  const lines = text
    .split("\n")
    .map(tidyLine)
    .filter(Boolean);

  type Cand = { display: string; key: string; marker?: "c" | "vc" };
  const cands: Cand[] = [];

  for (const line of lines) {
    if (isJunkLine(line)) continue;
    if (isCreditOrPointsLine(line)) continue;

    const { text: stripped, marker } = stripMarkers(line);
    if (!stripped || isJunkLine(stripped)) continue;
    if (isCreditOrPointsLine(stripped)) continue;

    const parts = stripped.split(/[|•·]/).map(tidyLine).filter(Boolean);
    const candidateText = parts[0] ?? stripped;

    if (!looksLikePersonName(candidateText)) continue;

    const display = sanitizePlayerDisplay(candidateText);
    if (!looksLikePersonName(display)) continue;
    const key = normalizeName(display);
    if (!key) continue;

    cands.push({ display, key, marker });
  }

  const seen = new Set<string>();
  const players: string[] = [];
  let captain = "";
  let viceCaptain = "";

  for (const c of cands) {
    if (seen.has(c.key)) continue;
    seen.add(c.key);
    players.push(c.display);
    if (c.marker === "c" && !captain) captain = c.display;
    if (c.marker === "vc" && !viceCaptain) viceCaptain = c.display;
    if (players.length >= 11) break;
  }

  if (!captain && players.length) {
    const cLine = lines.find((l) => /captaincy|captain\s*:/i.test(l));
    if (cLine) {
      const m = cLine.match(/captain\s*[:\-]\s*(.+)/i);
      if (m?.[1]) {
        const name = tidyLine(m[1]);
        if (looksLikePersonName(name)) captain = name.split(/[,(]/)[0]!.trim();
      }
    }
  }

  if (players.length < 6) {
    const re = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,4})\b/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(raw)) !== null) {
      const name = sanitizePlayerDisplay(m[1] ?? "");
      if (!name || isJunkLine(name) || isCreditOrPointsLine(name)) continue;
      if (!looksLikePersonName(name)) continue;
      const key = normalizeName(name);
      if (seen.has(key)) continue;
      seen.add(key);
      players.push(name);
      if (players.length >= 11) break;
    }
  }

  return {
    players,
    captain,
    viceCaptain,
  };
}
