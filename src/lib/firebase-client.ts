import { getApps, initializeApp, type FirebaseApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyCWQ5AQjLMKm3bdtkV9SvFYBoQF_zrWp8Q",
  authDomain: "ipl-fantasy-league-71959.firebaseapp.com",
  projectId: "ipl-fantasy-league-71959",
  storageBucket: "ipl-fantasy-league-71959.firebasestorage.app",
  messagingSenderId: "6454448286",
  appId: "1:6454448286:web:886fa7b0685880cb112b8f",
};

/** Single Firebase web app instance for Auth, Storage, Data Connect, etc. */
export function getFirebaseApp(): FirebaseApp {
  const existing = getApps()[0];
  if (existing) return existing;
  return initializeApp(firebaseConfig);
}

export const firebaseApp = getFirebaseApp();
