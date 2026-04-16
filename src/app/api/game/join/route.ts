import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { emptyTeam, processDream11Screenshot } from "@/lib/process-screenshot";

export const maxDuration = 120;

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const cricApiMatchId = String(formData.get("cricApiMatchId") ?? "").trim();
    const label = String(formData.get("label") ?? "").trim();
    const displayName = String(formData.get("displayName") ?? "").trim();
    const file = formData.get("file");

    if (!cricApiMatchId || !label || !displayName) {
      return NextResponse.json(
        { error: "Match, match title, and your name are required." },
        { status: 400 }
      );
    }

    const room = await prisma.gameRoom.upsert({
      where: { cricApiMatchId },
      create: { cricApiMatchId, label },
      update: { label },
    });

    const existing = await prisma.gamePlayer.findUnique({
      where: { roomId_displayName: { roomId: room.id, displayName } },
    });
    if (existing) {
      return NextResponse.json(
        {
          error: "You’ve already joined this game with that display name.",
          roomId: room.id,
          playerId: existing.id,
          alreadyJoined: true,
        },
        { status: 409 }
      );
    }

    let imagePath: string | null = null;
    let ocrText: string | null = null;
    let playersJson = emptyTeam;
    let ocrPoints: number | null = null;

    if (file instanceof Blob && file.size > 0) {
      const buf = Buffer.from(await file.arrayBuffer());
      const processed = await processDream11Screenshot(buf, `game/${room.id}`);
      imagePath = processed.imagePublicPath;
      ocrText = processed.ocrText;
      playersJson = processed.playersJson;
      ocrPoints = processed.ocrPoints;
    }

    const player = await prisma.gamePlayer.create({
      data: {
        roomId: room.id,
        displayName,
        imagePath,
        ocrText,
        ocrPoints,
        playersJson,
      },
    });

    return NextResponse.json({
      roomId: room.id,
      playerId: player.id,
      label: room.label,
    });
  } catch (e) {
    console.error("POST /api/game/join:", e);

    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === "P2002") {
        return NextResponse.json(
          {
            error: "That display name was just taken in this room. Try another.",
            code: e.code,
            detail: e.message,
          },
          { status: 409 }
        );
      }
      return NextResponse.json(
        {
          error: "Database error while joining.",
          code: e.code,
          detail: e.message,
          hint:
            e.message.includes("ocrPoints") || /no such column/i.test(e.message)
              ? "Run `npx prisma db push` in the ipl-fantasy folder so the DB matches schema."
              : undefined,
        },
        { status: 500 }
      );
    }

    const message = e instanceof Error ? e.message : String(e);
    const hint =
      /ocrPoints|no such column|does not exist/i.test(message)
        ? "Run `npx prisma db push` in the ipl-fantasy folder so the DB matches schema."
        : /ENOENT|EACCES|permission/i.test(message)
          ? "The server could not write the uploaded image under public/uploads. Check folder permissions."
          : undefined;

    return NextResponse.json(
      {
        error: "Could not join game.",
        detail: message,
        hint,
      },
      { status: 500 }
    );
  }
}
