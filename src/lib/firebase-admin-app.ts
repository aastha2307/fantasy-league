import { getApps, initializeApp } from "firebase-admin/app";

/** Ensures the default Firebase Admin app exists (ADC on Cloud Run, gcloud locally). */
export function ensureFirebaseAdminApp(): void {
  if (getApps().length === 0) {
    initializeApp();
  }
}
