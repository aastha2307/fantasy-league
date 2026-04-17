import { NextResponse } from "next/server";
import { getIplFantasyDataConnect } from "@/lib/dataconnect-admin";

/** Read-only ping against the deployed Data Connect schema (`DcHealth`). */
const DC_HEALTH_READ = `
  query DcHealthPing {
    dcHealths(limit: 3) {
      id
      label
    }
  }
`;

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const dc = getIplFantasyDataConnect();
    const res = await dc.executeGraphqlRead(DC_HEALTH_READ);
    return NextResponse.json({
      ok: true,
      dataConnect: res.data,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Data Connect request failed";
    return NextResponse.json(
      {
        ok: false,
        error: message,
        hint: "Deploy the service with: firebase deploy --only dataconnect",
      },
      { status: 503 }
    );
  }
}
