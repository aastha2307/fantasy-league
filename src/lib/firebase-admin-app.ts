import { getApps, initializeApp } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

let cachedDb: Firestore | undefined;

/** Ensures the default Firebase Admin app exists (ADC on Cloud Run, gcloud locally). */
export function ensureFirebaseAdminApp(): void {
  if (getApps().length === 0) {
    initializeApp();
  }
}

/** Firestore (Admin) — bypasses security rules; use only from trusted server routes. */
export function getAdminFirestore(): Firestore {
  ensureFirebaseAdminApp();
  cachedDb ??= getFirestore();
  return cachedDb;
}
