import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parsePlayersJson } from "@/lib/scoring";

export async function PATCH(req: Request, ctx: { params: Promise<{ submissionId: string }> }) {
  try {
    const { submissionId } = await ctx.params;
    const body = await req.json();
    const memberId = String(body.memberId ?? "");
    const playersJson = String(body.playersJson ?? "");

    if (!memberId || !playersJson) {
      return NextResponse.json({ error: "memberId and playersJson are required." }, { status: 400 });
    }

    const parsed = parsePlayersJson(playersJson);
    if (!parsed) {
      return NextResponse.json({ error: "Invalid players JSON." }, { status: 400 });
    }

    const sub = await prisma.teamSubmission.findUnique({ where: { id: submissionId } });
    if (!sub || sub.memberId !== memberId) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }

    const updated = await prisma.teamSubmission.update({
      where: { id: submissionId },
      data: { playersJson },
    });

    return NextResponse.json({ submission: updated });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Could not save team." }, { status: 500 });
  }
}
