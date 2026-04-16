"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { formatMatchScheduleLabel } from "@/lib/format-match-date";
import { filterMatchesToTodayAndYesterdayIst, sortMatchesForDisplay } from "@/lib/match-day-filter";
import { setGamePlayerId } from "@/lib/storage";

const MATCH_LIST_CACHE_KEY = "ipl-fantasy-ipl-series-matches-v1";

type CricMatch = {
  id: string;
  name: string;
  status: string;
  date?: string;
  dateTimeGMT?: string;
  matchStarted?: boolean;
  matchEnded?: boolean;
};

function applyDayFilterAndSort(raw: CricMatch[]): CricMatch[] {
  const dayOnly = filterMatchesToTodayAndYesterdayIst(raw);
  return sortMatchesForDisplay(dayOnly);
}

function pickFirstMatch(list: CricMatch[], setId: (id: string) => void, setLabel: (l: string) => void) {
  const first = list[0];
  if (first) {
    setId(first.id);
    setLabel(first.name);
  } else {
    setId("");
    setLabel("");
  }
}

export default function Home() {
  const router = useRouter();
  const [matches, setMatches] = useState<CricMatch[]>([]);
  const [matchesErr, setMatchesErr] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState("");
  const [selectedLabel, setSelectedLabel] = useState("");
  const [manualId, setManualId] = useState("");
  const [manualLabel, setManualLabel] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [alreadyJoined, setAlreadyJoined] = useState<{
    roomId: string;
    playerId: string;
    message: string;
  } | null>(null);
  const [matchesLoading, setMatchesLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const cached = typeof window !== "undefined" ? sessionStorage.getItem(MATCH_LIST_CACHE_KEY) : null;
      if (cached) {
        try {
          const parsed = JSON.parse(cached) as { matches: CricMatch[]; error: string | null };
          if (!cancelled) {
            const list = applyDayFilterAndSort(parsed.matches);
            setMatches(list);
            setMatchesErr(parsed.error);
            pickFirstMatch(list, setSelectedId, setSelectedLabel);
          }
        } catch {
          sessionStorage.removeItem(MATCH_LIST_CACHE_KEY);
        }
      }

      try {
        const res = await fetch("/api/cricket/current-matches", { cache: "no-store" });
        if (!res.ok) {
          if (!cancelled) {
            setMatchesErr(`Could not load matches (HTTP ${res.status}).`);
          }
          return;
        }
        const data = (await res.json()) as { matches?: unknown; error?: string };
        const raw = Array.isArray(data.matches) ? (data.matches as CricMatch[]) : [];

        const apiErr = typeof data.error === "string" ? data.error : null;
        if (typeof window !== "undefined") {
          sessionStorage.setItem(MATCH_LIST_CACHE_KEY, JSON.stringify({ matches: raw, error: apiErr }));
        }

        if (cancelled) return;

        const list = applyDayFilterAndSort(raw);
        setMatches(list);
        if (apiErr && raw.length === 0) {
          setMatchesErr(apiErr);
        } else {
          setMatchesErr(null);
        }
        pickFirstMatch(list, setSelectedId, setSelectedLabel);
      } catch (e) {
        if (!cancelled) {
          console.error("Match list fetch failed:", e);
          setMatchesErr(e instanceof Error ? e.message : "Network error loading matches.");
          setMatches([]);
          pickFirstMatch([], setSelectedId, setSelectedLabel);
        }
      } finally {
        if (!cancelled) setMatchesLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  function onPickMatch(id: string) {
    setSelectedId(id);
    setAlreadyJoined(null);
    const m = matches.find((x) => x.id === id);
    setSelectedLabel(m?.name ?? "");
  }

  async function joinGame(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setAlreadyJoined(null);
    const cricId = manualId.trim() || selectedId;
    const label = manualLabel.trim() || selectedLabel.trim();
    if (!cricId || !label) {
      setErr("Select a match from the list, or enter a Cricket Data match id and title.");
      return;
    }
    if (!displayName.trim()) {
      setErr("Enter your display name.");
      return;
    }

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("cricApiMatchId", cricId);
      fd.append("label", label);
      fd.append("displayName", displayName.trim());
      if (file) fd.append("file", file);

      const res = await fetch("/api/game/join", { method: "POST", body: fd });
      const data = (await res.json()) as {
        error?: string;
        detail?: string;
        hint?: string;
        roomId?: string;
        playerId?: string;
        alreadyJoined?: boolean;
      };

      if (res.status === 409 && data.roomId && data.playerId) {
        setAlreadyJoined({
          roomId: data.roomId,
          playerId: data.playerId,
          message:
            typeof data.error === "string"
              ? data.error
              : "You’ve already joined this game with that display name.",
        });
        return;
      }

      if (!res.ok) {
        const parts = [data.error, data.detail, data.hint].filter(
          (x): x is string => typeof x === "string" && x.length > 0
        );
        setErr(parts.length > 0 ? parts.join(" — ") : "Could not join game.");
        return;
      }

      if (!data.roomId || !data.playerId) {
        setErr("Unexpected response from server.");
        return;
      }

      setGamePlayerId(data.roomId, data.playerId);
      router.push(`/game/${data.roomId}`);
    } catch (x) {
      setErr(x instanceof Error ? x.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-full bg-zinc-50 px-4 py-12 dark:bg-zinc-950">
      <div className="mx-auto w-full max-w-lg space-y-8">
        <header className="text-center space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            IPL Dream11
          </h1>
          <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            Pick today&apos;s match, attach your Dream11 team screenshot, and join the leaderboard. We read your{" "}
            <strong className="text-zinc-800 dark:text-zinc-200">team points</strong> from the image (OCR).
          </p>
        </header>

        {alreadyJoined && (
          <div
            className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800 dark:bg-amber-950/40"
            role="alert"
          >
            <p className="text-sm text-amber-950 dark:text-amber-100">{alreadyJoined.message}</p>
            <button
              type="button"
              className="mt-3 w-full rounded-lg bg-amber-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-amber-800 dark:bg-amber-600 dark:hover:bg-amber-500"
              onClick={() => {
                setGamePlayerId(alreadyJoined.roomId, alreadyJoined.playerId);
                router.push(`/game/${alreadyJoined.roomId}`);
              }}
            >
              Go to leaderboard
            </button>
          </div>
        )}

        {err && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
            {err}
          </p>
        )}

        <form onSubmit={joinGame} className="space-y-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div>
            <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">IPL — today &amp; yesterday (IST)</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Only fixtures scheduled today or yesterday (India time). The series list is fetched once per browser
              tab and kept in memory; pick a match below or use manual ids. Add{" "}
              <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">CRICKET_API_KEY</code> to{" "}
              <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">.env</code> if this list is empty.
            </p>
            {matchesErr && (
              <p className="mt-2 text-sm text-amber-800 dark:text-amber-200">{matchesErr}</p>
            )}
            <div className="mt-3 max-h-56 space-y-2 overflow-y-auto rounded-xl border border-zinc-200 p-2 dark:border-zinc-700">
              {matches.length === 0 ? (
                <p className="px-2 py-3 text-sm text-zinc-500">
                  {matchesLoading
                    ? "Loading matches…"
                    : "No IPL fixtures today or yesterday (IST). Use manual ids below."}
                </p>
              ) : (
                matches.map((m) => (
                  <label
                    key={m.id}
                    className={`flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2 text-sm transition-colors ${
                      selectedId === m.id
                        ? "border-emerald-500 bg-emerald-50 dark:border-emerald-600 dark:bg-emerald-950/40"
                        : "border-transparent hover:bg-zinc-50 dark:hover:bg-zinc-800/80"
                    }`}
                  >
                    <input
                      type="radio"
                      name="match"
                      className="mt-1"
                      checked={selectedId === m.id}
                      onChange={() => onPickMatch(m.id)}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="font-medium text-zinc-900 dark:text-zinc-100">{m.name}</span>
                      <span className="mt-0.5 block text-xs tabular-nums text-zinc-600 dark:text-zinc-400">
                        {formatMatchScheduleLabel(m) || "Date TBA"}
                      </span>
                      <span className="mt-0.5 block text-xs text-zinc-500">{m.status}</span>
                    </span>
                  </label>
                ))
              )}
            </div>
          </div>

          <div className="border-t border-zinc-200 pt-4 dark:border-zinc-700">
            <h3 className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Or enter match manually</h3>
            <p className="mt-1 text-xs text-zinc-500">If the list is empty, paste id + title from cricapi.com.</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="text-sm text-zinc-700 dark:text-zinc-300">
                Cricket Data match id
                <input
                  className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 font-mono text-sm dark:border-zinc-600 dark:bg-zinc-950"
                  value={manualId}
                  onChange={(e) => {
                    setManualId(e.target.value);
                    setAlreadyJoined(null);
                  }}
                  placeholder="Optional"
                />
              </label>
              <label className="text-sm text-zinc-700 dark:text-zinc-300">
                Match title
                <input
                  className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
                  value={manualLabel}
                  onChange={(e) => {
                    setManualLabel(e.target.value);
                    setAlreadyJoined(null);
                  }}
                  placeholder="e.g. MI vs CSK"
                />
              </label>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">Your team screenshot</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Recommended — show your team screen with the <strong>points total</strong> visible so we can add it to
              the leaderboard. You can fix the number on the leaderboard page if OCR is wrong.
            </p>
            <input
              type="file"
              accept="image/*"
              className="mt-3 block w-full text-sm"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </div>

          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Your display name
            <input
              className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100"
              value={displayName}
              onChange={(e) => {
                setDisplayName(e.target.value);
                setAlreadyJoined(null);
              }}
              placeholder="Shown on the leaderboard"
              required
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {loading ? "Joining…" : "Join game"}
          </button>
        </form>

        <p className="text-center text-sm text-zinc-500">
          <Link href="/private" className="text-emerald-700 underline dark:text-emerald-400">
            Private leagues
          </Link>{" "}
          (create/join with a code)
        </p>
      </div>
    </div>
  );
}
