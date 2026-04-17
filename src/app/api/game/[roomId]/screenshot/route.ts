import { NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db";
import { processDream11Screenshot } from "@/lib/process-screenshot";

export const maxDuration = 120;

/**
 * Replace screenshot and re-run OCR to update team points.
 */
export async function POST(req: Request, ctx: { params: Promise<{ roomId: string }> }) {
  try {
    const { roomId } = await ctx.params;
    const formData = await req.formData();
    const playerId = String(formData.get("playerId") ?? "").trim();
    const file = formData.get("file");

    if (!playerId || !(file instanceof Blob) || file.size === 0) {
      return NextResponse.json({ error: "playerId and image file are required." }, { status: 400 });
    }

    const found = await queryOne<{ id: string }>(
      `SELECT id FROM "GamePlayer" WHERE id = $1 AND "roomId" = $2 LIMIT 1`,
      [playerId, roomId]
    );
    if (!found) {
      return NextResponse.json({ error: "Player not found in this game." }, { status: 404 });
    }

    const buf = Buffer.from(await file.arrayBuffer());
    const processed = await processDream11Screenshot(buf, `game/${roomId}`);

    await query(
      `UPDATE "GamePlayer"
       SET "imagePath" = $1,
           "ocrText" = $2,
           "ocrPoints" = $3,
           "playersJson" = $4
       WHERE id = $5`,
      [
        processed.imagePublicPath,
        processed.ocrText,
        processed.ocrPoints,
        processed.playersJson,
        playerId,
      ]
    );

    return NextResponse.json({
      ok: true,
      ocrPoints: processed.ocrPoints,
      imagePath: processed.imagePublicPath,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Could not process screenshot." }, { status: 500 });
  }
}
