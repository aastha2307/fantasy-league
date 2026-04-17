import { NextResponse } from "next/server";
import { newId, query, queryOne } from "@/lib/db";
import { emptyTeam, processDream11Screenshot } from "@/lib/process-screenshot";
import { parsePlayersJson } from "@/lib/scoring";

export const maxDuration = 120;

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");
    const matchId = String(formData.get("matchId") ?? "");
    const memberId = String(formData.get("memberId") ?? "");

    if (!file || !(file instanceof Blob) || !matchId || !memberId) {
      return NextResponse.json({ error: "file, matchId, and memberId are required." }, { status: 400 });
    }

    const member = await queryOne<{ id: string; leagueId: string }>(
      `SELECT id, "leagueId" FROM "Member" WHERE id = $1`,
      [memberId]
    );
    if (!member) {
      return NextResponse.json({ error: "Invalid member." }, { status: 403 });
    }

    const match = await queryOne<{ id: string; leagueId: string }>(
      `SELECT id, "leagueId" FROM "Match" WHERE id = $1`,
      [matchId]
    );
    if (!match || match.leagueId !== member.leagueId) {
      return NextResponse.json({ error: "Invalid match." }, { status: 403 });
    }

    const buf = Buffer.from(await file.arrayBuffer());
    const processed = await processDream11Screenshot(buf, matchId);
    const extracted = parsePlayersJson(processed.playersJson);
    const prev = await queryOne<{ id: string; playersJson: string }>(
      `SELECT id, "playersJson" FROM "TeamSubmission" WHERE "memberId" = $1 AND "matchId" = $2`,
      [memberId, matchId]
    );
    const prevTeam = prev ? parsePlayersJson(prev.playersJson) : null;
    const playersJson =
      extracted && extracted.players.length > 0
        ? processed.playersJson
        : prevTeam && prevTeam.players.length > 0
          ? JSON.stringify(prevTeam)
          : emptyTeam;

    const updatePlayers = Boolean(extracted && extracted.players.length > 0);

    let submission: {
      id: string;
      imagePath: string | null;
      ocrText: string | null;
      playersJson: string;
    };

    if (prev) {
      await query(
        `UPDATE "TeamSubmission"
         SET "imagePath" = $1,
             "ocrText" = $2,
             "playersJson" = CASE WHEN $3::boolean THEN $4 ELSE "playersJson" END,
             "updatedAt" = NOW()
         WHERE id = $5`,
        [processed.imagePublicPath, processed.ocrText, updatePlayers, playersJson, prev.id]
      );
      const row = await queryOne<{
        id: string;
        imagePath: string | null;
        ocrText: string | null;
        playersJson: string;
      }>(`SELECT id, "imagePath", "ocrText", "playersJson" FROM "TeamSubmission" WHERE id = $1`, [prev.id]);
      if (!row) {
        return NextResponse.json({ error: "Submission not found after update." }, { status: 500 });
      }
      submission = row;
    } else {
      const id = newId();
      await query(
        `INSERT INTO "TeamSubmission" (id, "memberId", "matchId", "imagePath", "ocrText", "playersJson")
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [id, memberId, matchId, processed.imagePublicPath, processed.ocrText, playersJson]
      );
      const row = await queryOne<{
        id: string;
        imagePath: string | null;
        ocrText: string | null;
        playersJson: string;
      }>(`SELECT id, "imagePath", "ocrText", "playersJson" FROM "TeamSubmission" WHERE id = $1`, [id]);
      if (!row) {
        return NextResponse.json({ error: "Submission not found after insert." }, { status: 500 });
      }
      submission = row;
    }

    return NextResponse.json({
      submission: {
        id: submission.id,
        imagePath: submission.imagePath,
        ocrText: submission.ocrText,
        playersJson: submission.playersJson,
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Upload or OCR failed." }, { status: 500 });
  }
}
