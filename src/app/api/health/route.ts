import { NextResponse } from "next/server";
import { queryOne } from "@/lib/db";
import { getIplFantasyDataConnect } from "@/lib/dataconnect-admin";

export const dynamic = "force-dynamic";

const DC_PING = `
  query HealthPing {
    dcHealths(limit: 1) {
      id
    }
  }
`;

type CheckStatus = "ok" | "error";

export async function GET() {
  const checks: Record<string, { status: CheckStatus; detail?: string }> = {};

  try {
    await queryOne(`SELECT 1 AS ok`);
    checks.postgresql = { status: "ok", detail: "node-postgres → Cloud SQL" };
  } catch (e) {
    checks.postgresql = {
      status: "error",
      detail: e instanceof Error ? e.message : "PostgreSQL query failed",
    };
  }

  try {
    const dc = getIplFantasyDataConnect();
    await dc.executeGraphqlRead(DC_PING);
    checks.dataConnect = { status: "ok" };
  } catch (e) {
    checks.dataConnect = {
      status: "error",
      detail: e instanceof Error ? e.message : "Data Connect unreachable",
    };
  }

  const allOk = Object.values(checks).every((c) => c.status === "ok");

  return NextResponse.json(
    { ok: allOk, service: "ipl-fantasy", checks },
    { status: allOk ? 200 : 503 }
  );
}
