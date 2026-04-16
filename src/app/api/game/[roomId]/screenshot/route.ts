import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
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

    const found = await prisma.$queryRaw<Array<{ id: string }>>(
      Prisma.sql`SELECT "id" FROM "GamePlayer" WHERE "id" = ${playerId} AND "roomId" = ${roomId} LIMIT 1`
    );
    if (!found.length) {
      return NextResponse.json({ error: "Player not found in this game." }, { status: 404 });
    }

    const buf = Buffer.from(await file.arrayBuffer());
    const processed = await processDream11Screenshot(buf, `game/${roomId}`);

    await prisma.$executeRaw(
      Prisma.sql`
        UPDATE "GamePlayer"
        SET "imagePath" = ${processed.imagePublicPath},
            "ocrText" = ${processed.ocrText},
            "ocrPoints" = ${processed.ocrPoints},
            "playersJson" = ${processed.playersJson}
        WHERE "id" = ${playerId}
      `
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
