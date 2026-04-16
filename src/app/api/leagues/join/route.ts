import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const joinCode = String(body.joinCode ?? "").trim().toUpperCase();
    const yourName = String(body.yourName ?? "").trim();
    if (!joinCode || !yourName) {
      return NextResponse.json({ error: "Join code and your name are required." }, { status: 400 });
    }

    const league = await prisma.league.findUnique({ where: { joinCode } });
    if (!league) {
      return NextResponse.json({ error: "Invalid join code." }, { status: 404 });
    }

    const existing = await prisma.member.findUnique({
      where: { leagueId_name: { leagueId: league.id, name: yourName } },
    });
    if (existing) {
      return NextResponse.json({
        league: { id: league.id, name: league.name, joinCode: league.joinCode },
        member: { id: existing.id, name: existing.name },
      });
    }

    const member = await prisma.member.create({
      data: { leagueId: league.id, name: yourName },
    });

    return NextResponse.json({
      league: { id: league.id, name: league.name, joinCode: league.joinCode },
      member: { id: member.id, name: member.name },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Could not join league." }, { status: 500 });
  }
}
