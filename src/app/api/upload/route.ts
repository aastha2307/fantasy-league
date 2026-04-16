import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
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

    const member = await prisma.member.findUnique({
      where: { id: memberId },
      include: { league: true },
    });
    if (!member) {
      return NextResponse.json({ error: "Invalid member." }, { status: 403 });
    }

    const match = await prisma.match.findUnique({ where: { id: matchId } });
    if (!match || match.leagueId !== member.leagueId) {
      return NextResponse.json({ error: "Invalid match." }, { status: 403 });
    }

    const buf = Buffer.from(await file.arrayBuffer());
    const processed = await processDream11Screenshot(buf, matchId);
    const extracted = parsePlayersJson(processed.playersJson);
    const prev = await prisma.teamSubmission.findUnique({
      where: { memberId_matchId: { memberId, matchId } },
    });
    const prevTeam = prev ? parsePlayersJson(prev.playersJson) : null;
    const playersJson =
      extracted && extracted.players.length > 0
        ? processed.playersJson
        : prevTeam && prevTeam.players.length > 0
          ? JSON.stringify(prevTeam)
          : emptyTeam;

    const submission = await prisma.teamSubmission.upsert({
      where: { memberId_matchId: { memberId, matchId } },
      create: {
        memberId,
        matchId,
        imagePath: processed.imagePublicPath,
        ocrText: processed.ocrText,
        playersJson,
      },
      update: {
        imagePath: processed.imagePublicPath,
        ocrText: processed.ocrText,
        ...(extracted && extracted.players.length > 0 ? { playersJson } : {}),
      },
    });

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
