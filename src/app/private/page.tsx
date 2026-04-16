"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { setMemberId } from "@/lib/storage";

export default function PrivateLeaguesPage() {
  const router = useRouter();
  const [leagueName, setLeagueName] = useState("");
  const [yourName, setYourName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [joinName, setJoinName] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function createLeague(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const res = await fetch("/api/leagues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leagueName, yourName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setMemberId(data.league.id, data.member.id);
      router.push(`/league/${data.league.id}`);
    } catch (x) {
      setErr(x instanceof Error ? x.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function joinLeague(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const res = await fetch("/api/leagues/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ joinCode, yourName: joinName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setMemberId(data.league.id, data.member.id);
      router.push(`/league/${data.league.id}`);
    } catch (x) {
      setErr(x instanceof Error ? x.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-full flex flex-col items-center px-4 py-16 bg-zinc-50 dark:bg-zinc-950">
      <div className="w-full max-w-lg space-y-8">
        <p className="text-center">
          <Link href="/" className="text-sm text-emerald-700 hover:underline dark:text-emerald-400">
            ← Back to live game
          </Link>
        </p>

        <header className="text-center space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Private leagues
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed">
            Create a league with a join code, or enter a friend&apos;s code.
          </p>
        </header>

        {err && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
            {err}
          </p>
        )}

        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">Create a league</h2>
          <form onSubmit={createLeague} className="mt-4 flex flex-col gap-3">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              League name
              <input
                className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100"
                value={leagueName}
                onChange={(e) => setLeagueName(e.target.value)}
                required
              />
            </label>
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Your display name
              <input
                className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100"
                value={yourName}
                onChange={(e) => setYourName(e.target.value)}
                required
              />
            </label>
            <button
              type="submit"
              disabled={loading}
              className="mt-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {loading ? "Working…" : "Create league"}
            </button>
          </form>
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">Join a league</h2>
          <form onSubmit={joinLeague} className="mt-4 flex flex-col gap-3">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Join code
              <input
                className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 font-mono uppercase tracking-wider text-zinc-900 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                required
              />
            </label>
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Your display name
              <input
                className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100"
                value={joinName}
                onChange={(e) => setJoinName(e.target.value)}
                required
              />
            </label>
            <button
              type="submit"
              disabled={loading}
              className="mt-2 rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-900 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
            >
              {loading ? "Working…" : "Join league"}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
