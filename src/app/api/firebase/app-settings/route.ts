import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase-admin-app";

export const dynamic = "force-dynamic";

const COLLECTION = "app";
const DOC_ID = "settings";

/** Server-side Firestore read (Admin SDK). Seeds a default doc if missing. */
export async function GET() {
  try {
    const db = getAdminFirestore();
    const ref = db.collection(COLLECTION).doc(DOC_ID);
    const snap = await ref.get();
    if (!snap.exists) {
      await ref.set({
        welcomeMessage: "Welcome to IPL Fantasy",
        updatedAt: FieldValue.serverTimestamp(),
      });
      const again = await ref.get();
      return NextResponse.json({
        id: again.id,
        ...again.data(),
      });
    }
    return NextResponse.json({
      id: snap.id,
      ...snap.data(),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Firestore error";
    console.error("GET /api/firebase/app-settings:", e);
    return NextResponse.json(
      {
        error: message,
        hint: "Enable Cloud Firestore in the Firebase console for this project, and ensure Admin credentials work locally (e.g. gcloud auth application-default login).",
      },
      { status: 503 }
    );
  }
}
