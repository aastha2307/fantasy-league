"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getMemberId } from "@/lib/storage";

type League = {
  id: string;
  name: string;
  joinCode: string;
  members: { id: string; name: string }[];
  matches: { id: string; label: string; matchDate: string | null }[];
};

export default function LeaguePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [league, setLeague] = useState<League | null>(null);
  const [memberId, setMemberIdState] = useState<string | null>(null);
  const [label, setLabel] = useState("");
  const [matchDate, setMatchDate] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const mid = getMemberId(id);
    if (!mid) {
      router.replace("/");
      return;
    }
    setMemberIdState(mid);
    void (async () => {
      const res = await fetch(`/api/leagues/${id}`);
      if (!res.ok) {
        router.replace("/");
        return;
      }
      const data = await res.json();
      setLeague(data);
      setLoading(false);
    })();
  }, [id, router]);

  async function addMatch(e: React.FormEvent) {
    e.preventDefault();
    if (!memberId) return;
    setErr(null);
    const res = await fetch("/api/matches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        leagueId: id,
        memberId,
        label,
        matchDate: matchDate || undefined,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setErr(data.error ?? "Could not add match");
      return;
    }
    setLabel("");
    setMatchDate("");
    setLeague((L) =>
      L
        ? {
            ...L,
            matches: [{ id: data.id, label: data.label, matchDate: data.matchDate }, ...L.matches],
          }
        : L
    );
  }

  async function copyCode() {
    if (!league) return;
    await navigator.clipboard.writeText(league.joinCode);
  }

  if (loading || !league) {
    return (
      <div className="min-h-full flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 text-zinc-500">
        Loading…
      </div>
    );
  }

  return (
    <div className="min-h-full bg-zinc-50 px-4 py-10 dark:bg-zinc-950">
      <div className="mx-auto max-w-2xl space-y-8">
        <div>
          <Link href="/" className="text-sm text-emerald-700 hover:underline dark:text-emerald-400">
            ← Home
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{league.name}</h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Share this code:{" "}
            <span className="font-mono font-semibold tracking-wider text-zinc-900 dark:text-zinc-100">
              {league.joinCode}
            </span>{" "}
            <button
              type="button"
              onClick={() => void copyCode()}
              className="ml-2 text-emerald-700 underline dark:text-emerald-400"
            >
              Copy
            </button>
          </p>
        </div>

        {err && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
            {err}
          </p>
        )}

        <section className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">Add a match</h2>
          <p className="mt-1 text-sm text-zinc-500">
            One fixture (e.g. MI vs CSK). Everyone uploads their team for this match.
          </p>
          <form onSubmit={addMatch} className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
            <label className="flex-1 min-w-[200px] text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Match label
              <input
                className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="MI vs CSK — Apr 15"
                required
              />
            </label>
            <label className="w-full sm:w-48 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Date (optional)
              <input
                type="date"
                className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950"
                value={matchDate}
                onChange={(e) => setMatchDate(e.target.value)}
              />
            </label>
            <button
              type="submit"
              className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700"
            >
              Add match
            </button>
          </form>
        </section>

        <section>
          <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">Matches</h2>
          <ul className="mt-3 space-y-2">
            {league.matches.length === 0 && (
              <li className="text-sm text-zinc-500">No matches yet. Add one above.</li>
            )}
            {league.matches.map((m) => (
              <li key={m.id}>
                <Link
                  href={`/league/${id}/match/${m.id}`}
                  className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-4 py-3 hover:border-emerald-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-emerald-700"
                >
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">{m.label}</span>
                  <span className="text-sm text-emerald-700 dark:text-emerald-400">Open →</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">Players</h2>
          <ul className="mt-2 flex flex-wrap gap-2">
            {league.members.map((m) => (
              <li
                key={m.id}
                className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              >
                {m.name}
                {m.id === memberId ? (
                  <span className="ml-1 text-zinc-400">(you)</span>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
