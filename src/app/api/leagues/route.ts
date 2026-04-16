import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const leagueName = String(body.leagueName ?? "").trim();
    const yourName = String(body.yourName ?? "").trim();
    if (!leagueName || !yourName) {
      return NextResponse.json({ error: "League name and your name are required." }, { status: 400 });
    }

    const joinCode = nanoid(8).toUpperCase();

    const result = await prisma.$transaction(async (tx) => {
      const league = await tx.league.create({
        data: { name: leagueName, joinCode },
      });
      const member = await tx.member.create({
        data: { leagueId: league.id, name: yourName },
      });
      return { league, member };
    });

    return NextResponse.json({
      league: {
        id: result.league.id,
        name: result.league.name,
        joinCode: result.league.joinCode,
      },
      member: { id: result.member.id, name: result.member.name },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Could not create league." }, { status: 500 });
  }
}
