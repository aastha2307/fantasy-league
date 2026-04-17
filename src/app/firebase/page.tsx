import type { Metadata } from "next";
import Link from "next/link";
import { FirebaseDbPanel } from "@/components/FirebaseDbPanel";

export const metadata: Metadata = {
  title: "Firebase — Firestore & Data Connect",
};

export default function FirebasePage() {
  return (
    <div className="min-h-full bg-zinc-50 px-4 py-12 dark:bg-zinc-950">
      <div className="mx-auto w-full max-w-lg space-y-6">
        <header>
          <Link
            href="/"
            className="text-sm leading-relaxed text-emerald-700 underline dark:text-emerald-400"
          >
            ← Back home
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Firebase database &amp; queries
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Firestore document reads via a Next.js API route (Admin SDK), and Data Connect GraphQL via the generated
            client SDK.
          </p>
        </header>

        <FirebaseDbPanel />
      </div>
    </div>
  );
}
