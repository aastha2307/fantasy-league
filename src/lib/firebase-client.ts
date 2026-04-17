import { getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { firebaseWebConfig } from "@/lib/firebase-config";

/** Single Firebase web app instance for Auth, Storage, Data Connect, etc. */
export function getFirebaseApp(): FirebaseApp {
  const existing = getApps()[0];
  if (existing) return existing;
  return initializeApp(firebaseWebConfig);
}

export const firebaseApp = getFirebaseApp();
