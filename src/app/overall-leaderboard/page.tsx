import Link from "next/link";
import { getOverallLeaderboardData } from "@/lib/overall-leaderboard";

export default async function OverallLeaderboardPage() {
  let overall: Awaited<ReturnType<typeof getOverallLeaderboardData>>;
  try {
    overall = await getOverallLeaderboardData();
  } catch {
    overall = { participants: [], gameResults: [] };
  }

  const participants = overall.participants ?? [];
  const gameResults = overall.gameResults ?? [];

  return (
    <div className="min-h-full bg-zinc-50 px-4 py-12 dark:bg-zinc-950">
      <div className="mx-auto w-full max-w-lg space-y-6">
        <div>
          <Link href="/" className="text-sm text-emerald-700 hover:underline dark:text-emerald-400">
            ← Home
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Overall leaderboard</h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Season standings across the six tracked players (wins, reward points, totals).
          </p>
        </div>

        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 space-y-4">
          <p className="text-xs text-zinc-500">
            Players are prepopulated in join form: aastha2307, Aakhri rastaa, Tantra Yantra Mantra, aaojeete,
            Anvesh Bandits 007, Bhenkar Bhopali.
          </p>
          <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-700">
              <table className="min-w-full divide-y divide-zinc-200 text-sm dark:divide-zinc-700">
                <thead className="bg-zinc-50 dark:bg-zinc-800/70">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold text-zinc-700 dark:text-zinc-200">Player</th>
                    <th className="px-3 py-2 text-right font-semibold text-zinc-700 dark:text-zinc-200">Wins</th>
                    <th className="px-3 py-2 text-right font-semibold text-zinc-700 dark:text-zinc-200">Reward</th>
                    <th className="px-3 py-2 text-right font-semibold text-zinc-700 dark:text-zinc-200">Matches</th>
                    <th className="px-3 py-2 text-right font-semibold text-zinc-700 dark:text-zinc-200">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {participants.map((p, idx) => (
                    <tr key={p.key} className={idx === 0 ? "bg-emerald-50/70 dark:bg-emerald-950/20" : undefined}>
                      <td className="px-3 py-2 text-zinc-900 dark:text-zinc-100">
                        <p className="font-medium">{p.displayName}</p>
                        <p className="text-xs text-zinc-500">{p.personName}</p>
                      </td>
                      <td className="px-3 py-2 text-right font-semibold text-zinc-900 dark:text-zinc-100">{p.wins}</td>
                      <td className="px-3 py-2 text-right font-semibold text-amber-700 dark:text-amber-300">
                        {p.rewardPoints}
                      </td>
                      <td className="px-3 py-2 text-right text-zinc-700 dark:text-zinc-300">{p.matchesPlayed}</td>
                      <td className="px-3 py-2 text-right font-mono tabular-nums text-zinc-800 dark:text-zinc-200">
                        {p.totalPoints.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {gameResults.length > 0 && (
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Game results (1st &amp; 2nd)</p>
                <ul className="mt-2 space-y-2">
                  {gameResults.map((g) => (
                    <li
                      key={g.roomId}
                      className="rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700"
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                        <p className="min-w-0 flex-1 truncate font-medium text-zinc-900 dark:text-zinc-100">
                          {g.label}
                        </p>
                        <Link
                          href={`/game/${g.roomId}`}
                          className="inline-flex shrink-0 items-center justify-center rounded-lg border border-emerald-600 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 dark:border-emerald-500 dark:bg-emerald-950/40 dark:text-emerald-200 dark:hover:bg-emerald-900/50"
                        >
                          View leaderboard
                        </Link>
                      </div>
                      <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-300">
                        1st: {g.first.displayName} ({g.first.personName}) - {g.first.points.toFixed(2)} pts (+
                        {g.first.rewardPoints})
                      </p>
                      {g.second ? (
                        <p className="text-xs text-zinc-600 dark:text-zinc-300">
                          2nd: {g.second.displayName} ({g.second.personName}) - {g.second.points.toFixed(2)} pts (+
                          {g.second.rewardPoints})
                        </p>
                      ) : (
                        <p className="text-xs text-zinc-500">2nd: Not enough tracked players in this game.</p>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {gameResults.length === 0 && (
              <p className="text-sm text-zinc-500">
                No tracked winners yet. Once these six players join matches with the exact display names, this list will
                populate automatically.
              </p>
            )}
        </section>
      </div>
    </div>
  );
}
