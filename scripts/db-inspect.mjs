#!/usr/bin/env node
/**
 * Print row counts and recent rows for core tables (PostgreSQL).
 * Usage: from `ipl-fantasy/`, with `.env` containing DATABASE_URL:
 *   npm run db:inspect
 */
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import pg from "pg";

function loadDotEnv() {
  const p = resolve(process.cwd(), ".env");
  if (!existsSync(p)) return;
  const raw = readFileSync(p, "utf8");
  for (const line of raw.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq <= 0) continue;
    const key = t.slice(0, eq).trim();
    let val = t.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

loadDotEnv();

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set. Copy .env.example to .env or export DATABASE_URL.");
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: url, max: 2 });

const tables = [
  "League",
  "Member",
  "Match",
  "TeamSubmission",
  "PlayerMatchPoints",
  "GameRoom",
  "GamePlayer",
];

async function main() {
  console.log("DATABASE_URL host:", (() => {
    try {
      return new URL(url.replace(/^postgresql:/, "http:")).host;
    } catch {
      return "(unparsed)";
    }
  })());
  console.log("");

  for (const t of tables) {
    try {
      const { rows } = await pool.query(`SELECT COUNT(*)::int AS c FROM "${t}"`);
      console.log(`${t}: ${rows[0].c} rows`);
    } catch (e) {
      console.log(`${t}: (error — table missing or no access?) ${e instanceof Error ? e.message : e}`);
    }
  }

  console.log("\n--- Sample: latest League ---");
  try {
    const { rows } = await pool.query(
      `SELECT id, name, "joinCode", "createdAt" FROM "League" ORDER BY "createdAt" DESC LIMIT 5`
    );
    console.log(rows.length ? JSON.stringify(rows, null, 2) : "(none)");
  } catch (e) {
    console.log(e instanceof Error ? e.message : e);
  }

  console.log("\n--- Sample: latest GameRoom ---");
  try {
    const { rows } = await pool.query(
      `SELECT id, label, "cricApiMatchId", "createdAt" FROM "GameRoom" ORDER BY "createdAt" DESC LIMIT 5`
    );
    console.log(rows.length ? JSON.stringify(rows, null, 2) : "(none)");
  } catch (e) {
    console.log(e instanceof Error ? e.message : e);
  }

  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
