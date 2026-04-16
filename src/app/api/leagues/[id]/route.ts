import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const league = await prisma.league.findUnique({
    where: { id },
    include: {
      members: { orderBy: { createdAt: "asc" } },
      matches: { orderBy: { matchDate: "desc" } },
    },
  });
  if (!league) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(league);
}
