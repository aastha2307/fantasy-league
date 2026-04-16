import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, ctx: { params: Promise<{ matchId: string }> }) {
  const { matchId } = await ctx.params;
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    select: { id: true, label: true, cricApiMatchId: true },
  });
  if (!match) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(match);
}

export async function PATCH(req: Request, ctx: { params: Promise<{ matchId: string }> }) {
  try {
    const { matchId } = await ctx.params;
    const body = await req.json();
    const memberId = String(body.memberId ?? "");
    const cricApiMatchId =
      body.cricApiMatchId === null || body.cricApiMatchId === ""
        ? null
        : String(body.cricApiMatchId);

    if (!memberId) {
      return NextResponse.json({ error: "memberId is required." }, { status: 400 });
    }

    const match = await prisma.match.findUnique({ where: { id: matchId } });
    if (!match) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }

    const member = await prisma.member.findFirst({
      where: { id: memberId, leagueId: match.leagueId },
    });
    if (!member) {
      return NextResponse.json({ error: "Not a member of this league." }, { status: 403 });
    }

    const updated = await prisma.match.update({
      where: { id: matchId },
      data: { cricApiMatchId },
    });

    return NextResponse.json({
      id: updated.id,
      label: updated.label,
      cricApiMatchId: updated.cricApiMatchId,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Could not update match." }, { status: 500 });
  }
}
