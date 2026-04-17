import { getDataConnect } from "firebase-admin/data-connect";
import { ensureFirebaseAdminApp } from "@/lib/firebase-admin-app";

/** Matches `dataconnect/dataconnect.yaml` (override with env on App Hosting if you rename the service). */
const DEFAULT_SERVICE_ID = "ipl-fantasy-league-71959-service";
const DEFAULT_LOCATION = "asia-south1";

export function getIplFantasyDataConnect() {
  ensureFirebaseAdminApp();
  const serviceId = process.env.DATA_CONNECT_SERVICE_ID?.trim() || DEFAULT_SERVICE_ID;
  const location = process.env.DATA_CONNECT_LOCATION?.trim() || DEFAULT_LOCATION;
  return getDataConnect({ serviceId, location });
}
