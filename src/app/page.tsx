"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { formatMatchScheduleLabel } from "@/lib/format-match-date";
import { sortMatchesForDisplay } from "@/lib/match-day-filter";
import { setGamePlayerId } from "@/lib/storage";
import { TRACKED_PLAYERS } from "@/lib/tracked-players";
import type { ActiveRoom } from "@/app/api/game/active/route";
import type { OverallLeaderboardResponse } from "@/app/api/game/overall/route";

const MATCH_LIST_CACHE_KEY = "ipl-fantasy-ipl-series-matches-v2-today-yesterday";

type CricMatch = {
  id: string;
  name: string;
  status: string;
  date?: string;
  dateTimeGMT?: string;
  matchStarted?: boolean;
  matchEnded?: boolean;
};

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
  const [displayName, setDisplayName] = useState(TRACKED_PLAYERS[0]?.displayName ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [alreadyJoined, setAlreadyJoined] = useState<{
    roomId: string;
    playerId: string;
    message: string;
  } | null>(null);
  const [matchesLoading, setMatchesLoading] = useState(true);
  const [activeRooms, setActiveRooms] = useState<ActiveRoom[]>([]);
  const [activeRoomsLoading, setActiveRoomsLoading] = useState(true);
  const [overall, setOverall] = useState<OverallLeaderboardResponse | null>(null);
  const [overallLoading, setOverallLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/game/active", { cache: "no-store" });
        if (res.ok) {
          const data = (await res.json()) as { rooms: ActiveRoom[] };
          setActiveRooms(data.rooms ?? []);
        }
      } catch {
        // silently ignore – active games section just won't show
      } finally {
        setActiveRoomsLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/game/overall", { cache: "no-store" });
        if (res.ok) {
          const data = (await res.json()) as OverallLeaderboardResponse;
          setOverall(data);
        }
      } catch {
        // silently ignore - this section is best effort only
      } finally {
        setOverallLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const cached = typeof window !== "undefined" ? sessionStorage.getItem(MATCH_LIST_CACHE_KEY) : null;
      if (cached) {
        try {
          const parsed = JSON.parse(cached) as { matches: CricMatch[]; error: string | null };
          if (!cancelled) {
            const list = sortMatchesForDisplay(parsed.matches);
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

        const list = sortMatchesForDisplay(raw);
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

        {/* ── Active games ── */}
        {(activeRoomsLoading || activeRooms.length > 0) && (
          <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 space-y-3">
            <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">Active games</h2>
            {activeRoomsLoading ? (
              <p className="text-sm text-zinc-500">Loading…</p>
            ) : (
              <ul className="space-y-2">
                {activeRooms.map((room) => (
                  <li
                    key={room.roomId}
                    className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 px-4 py-3 dark:border-zinc-700"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-zinc-900 dark:text-zinc-100">{room.label}</p>
                      <p className="text-xs text-zinc-500">
                        {room.playerCount} {room.playerCount === 1 ? "player" : "players"} joined
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setManualId(room.cricApiMatchId);
                        setManualLabel(room.label);
                        setSelectedId("");
                        setSelectedLabel("");
                        window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
                      }}
                      className="shrink-0 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                    >
                      Join &amp; upload
                    </button>
                    <Link
                      href={`/game/${room.roomId}`}
                      className="shrink-0 rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    >
                      Leaderboard
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 space-y-4">
          <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">Overall leaderboard (6 players)</h2>
          <p className="text-xs text-zinc-500">
            Players are prepopulated in join form: aastha2307, Aakhri rastaa, Tantra Yantra Mantra, aaojeete,
            Anvesh Bandits 007, Bhenkar Bhopali.
          </p>
          {overallLoading || !overall ? (
            <p className="text-sm text-zinc-500">Loading overall standings…</p>
          ) : (
            <>
              {(() => {
                const participants = overall.participants ?? [];
                const gameResults = overall.gameResults ?? [];
                return (
                  <>
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
                        <td className="px-3 py-2 text-right font-semibold text-amber-700 dark:text-amber-300">{p.rewardPoints}</td>
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
                        <p className="truncate text-zinc-900 dark:text-zinc-100">{g.label}</p>
                        <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-300">
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
                  No tracked winners yet. Once these six players join matches with the exact display names, this list
                  will populate automatically.
                </p>
              )}
                  </>
                );
              })()}
            </>
          )}
        </section>

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
              Matches are loaded from the bundled fixture list and limited to IST calendar today and yesterday. The list
              is cached per browser tab; pick a match below or use manual ids if none appear.
            </p>
            {matchesErr && (
              <p className="mt-2 text-sm text-amber-800 dark:text-amber-200">{matchesErr}</p>
            )}
            <div className="mt-3 max-h-56 space-y-2 overflow-y-auto rounded-xl border border-zinc-200 p-2 dark:border-zinc-700">
              {matches.length === 0 ? (
                <p className="px-2 py-3 text-sm text-zinc-500">
                  {matchesLoading
                    ? "Loading matches…"
                    : "No IPL fixtures for today or yesterday (IST). Use manual ids below."}
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
              id="team-screenshot-upload"
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <label
                htmlFor="team-screenshot-upload"
                className="inline-flex cursor-pointer rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                Choose file
              </label>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                {file ? file.name : "No file chosen"}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Player</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {TRACKED_PLAYERS.map((p) => {
                const selected = displayName === p.displayName;
                return (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => {
                      setDisplayName(p.displayName);
                      setAlreadyJoined(null);
                    }}
                    className={`rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                      selected
                        ? "border-emerald-500 bg-emerald-50 text-emerald-900 dark:border-emerald-500 dark:bg-emerald-950/30 dark:text-emerald-200"
                        : "border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-900"
                    }`}
                  >
                    <p className="font-medium">{p.displayName}</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">{p.personName}</p>
                  </button>
                );
              })}
            </div>
            <select
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100"
              value={displayName}
              onChange={(e) => {
                setDisplayName(e.target.value);
                setAlreadyJoined(null);
              }}
              required
            >
              {TRACKED_PLAYERS.map((p) => (
                <option key={p.key} value={p.displayName}>
                  {p.displayName} ({p.personName})
                </option>
              ))}
            </select>
          </div>

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
          (create/join with a code) ·{" "}
          <Link href="/firebase" className="text-emerald-700 underline dark:text-emerald-400">
            Firebase (Firestore + Data Connect)
          </Link>
        </p>
      </div>
    </div>
  );
}
