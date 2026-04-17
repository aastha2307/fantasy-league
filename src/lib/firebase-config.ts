/**
 * Firebase Web SDK config (public values — safe for NEXT_PUBLIC_* and client bundles).
 * Override via env in App Hosting / .env.local so one codebase can target different projects.
 */
export const firebaseWebConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "AIzaSyCWQ5AQjLMKm3bdtkV9SvFYBoQF_zrWp8Q",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "ipl-fantasy-league-71959.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "ipl-fantasy-league-71959",
  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "ipl-fantasy-league-71959.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "6454448286",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "1:6454448286:web:886fa7b0685880cb112b8f",
};
