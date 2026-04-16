import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeName } from "@/lib/scoring";

export async function POST(req: Request, ctx: { params: Promise<{ matchId: string }> }) {
  try {
    const { matchId } = await ctx.params;
    const body = await req.json();
    const memberId = String(body.memberId ?? "");
    const csv = String(body.csv ?? "").trim();

    if (!memberId) {
      return NextResponse.json({ error: "memberId is required." }, { status: 400 });
    }

    const member = await prisma.member.findUnique({ where: { id: memberId } });
    if (!member) {
      return NextResponse.json({ error: "Invalid member." }, { status: 403 });
    }

    const match = await prisma.match.findUnique({ where: { id: matchId } });
    if (!match || match.leagueId !== member.leagueId) {
      return NextResponse.json({ error: "Invalid match." }, { status: 403 });
    }

    const byName = new Map<string, { playerName: string; points: number }>();
    if (csv.length > 0) {
      const lines = csv.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      for (const line of lines) {
        const [namePart, ptsPart] = line.split(/[,\t]/).map((s) => s.trim());
        if (!namePart) continue;
        const pts = parseFloat(ptsPart ?? "0");
        if (Number.isNaN(pts)) continue;
        const playerName = namePart.trim();
        const key = normalizeName(playerName);
        if (!key) continue;
        byName.set(key, { playerName, points: pts });
      }
    }

    const rows = [...byName.values()];

    await prisma.$transaction(async (tx) => {
      await tx.playerMatchPoints.deleteMany({ where: { matchId } });
      for (const r of rows) {
        await tx.playerMatchPoints.create({
          data: {
            matchId,
            playerName: r.playerName,
            points: r.points,
          },
        });
      }
    });

    return NextResponse.json({ count: rows.length });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Could not save points." }, { status: 500 });
  }
}
