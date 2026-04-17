-- Core app tables (matches docs/schema.prisma). Applied automatically on first `docker compose up` via initdb.

CREATE TABLE IF NOT EXISTS "League" (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  "joinCode" TEXT NOT NULL UNIQUE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "Member" (
  id TEXT PRIMARY KEY,
  "leagueId" TEXT NOT NULL REFERENCES "League"(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE ("leagueId", name)
);

CREATE TABLE IF NOT EXISTS "Match" (
  id TEXT PRIMARY KEY,
  "leagueId" TEXT NOT NULL REFERENCES "League"(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  "matchDate" TIMESTAMPTZ,
  "cricApiMatchId" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "TeamSubmission" (
  id TEXT PRIMARY KEY,
  "memberId" TEXT NOT NULL REFERENCES "Member"(id) ON DELETE CASCADE,
  "matchId" TEXT NOT NULL REFERENCES "Match"(id) ON DELETE CASCADE,
  "imagePath" TEXT,
  "ocrText" TEXT,
  "playersJson" TEXT NOT NULL,
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE ("memberId", "matchId")
);

CREATE TABLE IF NOT EXISTS "PlayerMatchPoints" (
  id TEXT PRIMARY KEY,
  "matchId" TEXT NOT NULL REFERENCES "Match"(id) ON DELETE CASCADE,
  "playerName" TEXT NOT NULL,
  points DOUBLE PRECISION NOT NULL,
  UNIQUE ("matchId", "playerName")
);

CREATE TABLE IF NOT EXISTS "GameRoom" (
  id TEXT PRIMARY KEY,
  "cricApiMatchId" TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "GamePlayer" (
  id TEXT PRIMARY KEY,
  "roomId" TEXT NOT NULL REFERENCES "GameRoom"(id) ON DELETE CASCADE,
  "displayName" TEXT NOT NULL,
  "imagePath" TEXT,
  "ocrText" TEXT,
  "ocrPoints" DOUBLE PRECISION,
  "playersJson" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE ("roomId", "displayName")
);
