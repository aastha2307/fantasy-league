"use client";

import dynamic from "next/dynamic";

/** Dynamic `ssr: false` must live in a Client Component (Next.js 16). Data loads via `/api/game/overall` in the browser. */
const OverallLeaderboardClient = dynamic(
  () => import("./OverallLeaderboardClient").then((mod) => mod.OverallLeaderboardClient),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-full bg-zinc-50 px-4 py-12 dark:bg-zinc-950">
        <div className="mx-auto w-full max-w-lg">
          <p className="text-sm text-zinc-500" role="status">
            Loading leaderboard…
          </p>
        </div>
      </div>
    ),
  }
);

export default function OverallLeaderboardPage() {
  return <OverallLeaderboardClient />;
}
