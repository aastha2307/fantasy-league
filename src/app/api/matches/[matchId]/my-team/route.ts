import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, ctx: { params: Promise<{ matchId: string }> }) {
  const { matchId } = await ctx.params;
  const memberId = new URL(req.url).searchParams.get("memberId");
  if (!memberId) {
    return NextResponse.json({ error: "memberId required" }, { status: 400 });
  }

  const member = await prisma.member.findUnique({ where: { id: memberId } });
  if (!member) {
    return NextResponse.json({ error: "Invalid member" }, { status: 403 });
  }

  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match || match.leagueId !== member.leagueId) {
    return NextResponse.json({ error: "Invalid match" }, { status: 403 });
  }

  const submission = await prisma.teamSubmission.findUnique({
    where: { memberId_matchId: { memberId, matchId } },
  });

  return NextResponse.json({ submission });
}
