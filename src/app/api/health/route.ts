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
  const databaseUrl = process.env.DATABASE_URL ?? "";
  const dbEnvInfo = {
    present: databaseUrl.length > 0,
    usesCloudSqlSocket:
      databaseUrl.includes("/cloudsql/") ||
      databaseUrl.includes("%2Fcloudsql%2F") ||
      databaseUrl.includes("host=/cloudsql") ||
      databaseUrl.includes("host=%2Fcloudsql"),
  };

  try {
    await queryOne(`SELECT 1 AS ok`);
    checks.postgresql = {
      status: "ok",
      detail: `node-postgres -> Cloud SQL (DATABASE_URL present=${dbEnvInfo.present}, socket=${dbEnvInfo.usesCloudSqlSocket})`,
    };
  } catch (e) {
    checks.postgresql = {
      status: "error",
      detail: `${e instanceof Error ? e.message : "PostgreSQL query failed"} (DATABASE_URL present=${dbEnvInfo.present}, socket=${dbEnvInfo.usesCloudSqlSocket})`,
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
