import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const empty = JSON.stringify({ players: [] as string[], captain: "", viceCaptain: "" });

export async function POST(req: Request, ctx: { params: Promise<{ matchId: string }> }) {
  try {
    const { matchId } = await ctx.params;
    const body = await req.json();
    const memberId = String(body.memberId ?? "");
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

    const submission = await prisma.teamSubmission.upsert({
      where: { memberId_matchId: { memberId, matchId } },
      create: { memberId, matchId, playersJson: empty },
      update: {},
    });

    return NextResponse.json({ submission });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Could not create draft." }, { status: 500 });
  }
}
