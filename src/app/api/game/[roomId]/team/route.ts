import { NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db";
import { parsePlayersJson } from "@/lib/scoring";

/**
 * Update manual fantasy points (if OCR misread) or playing XI JSON (legacy).
 */
export async function PATCH(req: Request, ctx: { params: Promise<{ roomId: string }> }) {
  try {
    const { roomId } = await ctx.params;
    const body = (await req.json().catch(() => null)) as {
      playerId?: string;
      ocrPoints?: number | null;
      playersJson?: string;
    } | null;
    const playerId = String(body?.playerId ?? "").trim();
    if (!playerId) {
      return NextResponse.json({ error: "playerId is required." }, { status: 400 });
    }

    const hasManualPoints = Boolean(body && "ocrPoints" in body);
    const playersJson = body?.playersJson;

    if (!hasManualPoints && (playersJson === undefined || playersJson === "")) {
      return NextResponse.json({ error: "Send ocrPoints and/or playersJson." }, { status: 400 });
    }

    if (playersJson !== undefined && playersJson !== "") {
      const parsed = parsePlayersJson(playersJson);
      if (!parsed) {
        return NextResponse.json({ error: "Invalid playersJson." }, { status: 400 });
      }
    }

    const gp = await queryOne<{ id: string }>(
      `SELECT id FROM "GamePlayer" WHERE id = $1 AND "roomId" = $2`,
      [playerId, roomId]
    );
    if (!gp) {
      return NextResponse.json({ error: "Player not found in this game." }, { status: 404 });
    }

    const sets: string[] = [];
    const params: unknown[] = [];
    let i = 1;

    if (hasManualPoints) {
      const v = body!.ocrPoints;
      if (v !== null && v !== undefined && (typeof v !== "number" || Number.isNaN(v))) {
        return NextResponse.json({ error: "ocrPoints must be a number or null." }, { status: 400 });
      }
      const rounded = v === null || v === undefined ? null : Math.round(v * 100) / 100;
      sets.push(`"ocrPoints" = $${i++}`);
      params.push(rounded);
    }
    if (playersJson !== undefined && playersJson !== "") {
      sets.push(`"playersJson" = $${i++}`);
      params.push(playersJson);
    }

    if (sets.length === 0) {
      return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
    }

    await query(`UPDATE "GamePlayer" SET ${sets.join(", ")} WHERE id = $${i}`, [...params, playerId]);

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Could not save." }, { status: 500 });
  }
}
