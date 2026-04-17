import { NextResponse } from "next/server";
import { isPgUniqueViolation, newId, query, queryOne } from "@/lib/db";
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

    const room = await queryOne<{
      id: string;
      label: string;
      cricApiMatchId: string;
    }>(
      `INSERT INTO "GameRoom" (id, "cricApiMatchId", label)
       VALUES ($1, $2, $3)
       ON CONFLICT ("cricApiMatchId") DO UPDATE SET label = EXCLUDED.label
       RETURNING id, label, "cricApiMatchId"`,
      [newId(), cricApiMatchId, label]
    );
    if (!room) {
      return NextResponse.json({ error: "Could not create or load game room." }, { status: 500 });
    }

    const existing = await queryOne<{ id: string }>(
      `SELECT id FROM "GamePlayer" WHERE "roomId" = $1 AND "displayName" = $2`,
      [room.id, displayName]
    );
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

    const playerId = newId();
    try {
      await query(
        `INSERT INTO "GamePlayer" (id, "roomId", "displayName", "imagePath", "ocrText", "ocrPoints", "playersJson")
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [playerId, room.id, displayName, imagePath, ocrText, ocrPoints, playersJson]
      );
    } catch (e) {
      if (isPgUniqueViolation(e)) {
        return NextResponse.json(
          {
            error: "That display name was just taken in this room. Try another.",
            code: "23505",
          },
          { status: 409 }
        );
      }
      throw e;
    }

    return NextResponse.json({
      roomId: room.id,
      playerId,
      label: room.label,
    });
  } catch (e) {
    console.error("POST /api/game/join:", e);

    if (isPgUniqueViolation(e)) {
      return NextResponse.json(
        {
          error: "That display name was just taken in this room. Try another.",
          code: "23505",
        },
        { status: 409 }
      );
    }

    const message = e instanceof Error ? e.message : String(e);
    const hint =
      /ocrPoints|no such column|does not exist/i.test(message)
        ? "Ensure the database schema matches the app (e.g. GamePlayer.ocrPoints column)."
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
