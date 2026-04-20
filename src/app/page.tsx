"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { formatMatchScheduleLabel } from "@/lib/format-match-date";
import { filterMatchesToTodayAndYesterdayIst, sortMatchesForDisplay } from "@/lib/match-day-filter";
import {
  getGamePlayerId,
  getRoomIdForCricMatch,
  hasJoinedRoomAsDisplayName,
  setGamePlayerId,
  setGamePlayerDisplayNameForRoom,
  setRoomIdForCricMatch,
} from "@/lib/storage";
import { TRACKED_PLAYERS } from "@/lib/tracked-players";
import type { ActiveRoom } from "@/app/api/game/active/route";
import apiResponse from "@/app/api/cricket/current-matches/apiresponse.json";
import { AppAlertModal, type AppAlertModalTone } from "@/components/AppAlertModal";

type CricMatch = {
  id: string;
  name: string;
  status: string;
  date?: string;
  dateTimeGMT?: string;
  matchStarted?: boolean;
  matchEnded?: boolean;
};

const ALL_MATCHES: CricMatch[] = Array.isArray(apiResponse.matches)
  ? (apiResponse.matches as CricMatch[])
  : [];

const TODAYS_MATCHES = sortMatchesForDisplay(filterMatchesToTodayAndYesterdayIst(ALL_MATCHES));

export default function Home() {
  const router = useRouter();
  const [matches] = useState<CricMatch[]>(TODAYS_MATCHES);
  const [selectedId, setSelectedId] = useState(TODAYS_MATCHES[0]?.id ?? "");
  const [selectedLabel, setSelectedLabel] = useState(TODAYS_MATCHES[0]?.name ?? "");
  const [displayName, setDisplayName] = useState(TRACKED_PLAYERS[0]?.displayName ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [alertModal, setAlertModal] = useState<{
    title: string;
    message: string;
    tone: AppAlertModalTone;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeRooms, setActiveRooms] = useState<ActiveRoom[]>([]);
  const [activeRoomsLoading, setActiveRoomsLoading] = useState(true);
  /** Avoid reading localStorage before mount (SSR/hydration). */
  const [storageReady, setStorageReady] = useState(false);

  const cricToActiveRoomId = useMemo(
    () => new Map(activeRooms.map((r) => [r.cricApiMatchId, r.roomId] as const)),
    [activeRooms]
  );

  useEffect(() => {
    setStorageReady(true);
  }, []);

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

  /** If this browser already joined an active room, persist match id → room id for the join form. */
  useEffect(() => {
    if (!storageReady) return;
    for (const r of activeRooms) {
      if (getGamePlayerId(r.roomId)) {
        setRoomIdForCricMatch(r.cricApiMatchId, r.roomId);
      }
    }
  }, [storageReady, activeRooms]);

  const roomIdForSelectedMatch =
    storageReady && selectedId
      ? getRoomIdForCricMatch(selectedId) ?? cricToActiveRoomId.get(selectedId) ?? null
      : null;
  const joinedSelectedMatch = Boolean(
    roomIdForSelectedMatch && hasJoinedRoomAsDisplayName(roomIdForSelectedMatch, displayName)
  );

  function showAlert(message: string, opts?: { title?: string; tone?: AppAlertModalTone }) {
    setAlertModal({
      message,
      title: opts?.title ?? "Error",
      tone: opts?.tone ?? "error",
    });
  }

  function onPickMatch(id: string) {
    setSelectedId(id);
    const m = matches.find((x) => x.id === id);
    setSelectedLabel(m?.name ?? "");
  }

  async function joinGame(e: React.FormEvent) {
    e.preventDefault();
    setAlertModal(null);
    const cricId = selectedId.trim();
    const label = selectedLabel.trim();
    if (!cricId || !label) {
      showAlert("Select a match from the list.", { title: "Can’t join yet", tone: "neutral" });
      return;
    }
    if (!displayName.trim()) {
      showAlert("Enter your display name.", { title: "Can’t join yet", tone: "neutral" });
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
        setGamePlayerId(data.roomId, data.playerId);
        setGamePlayerDisplayNameForRoom(data.roomId, displayName.trim());
        setRoomIdForCricMatch(cricId, data.roomId);
        const alreadyMsg =
          typeof data.error === "string" && data.error.trim().length > 0
            ? data.error.trim()
            : "You have already joined this game.";
        showAlert(alreadyMsg, { title: "Already joined", tone: "neutral" });
        return;
      }

      if (!res.ok) {
        const parts = [data.error, data.detail, data.hint].filter(
          (x): x is string => typeof x === "string" && x.length > 0
        );
        showAlert(parts.length > 0 ? parts.join(" — ") : "Could not join game.");
        return;
      }

      if (!data.roomId || !data.playerId) {
        showAlert("Unexpected response from server.");
        return;
      }

      setGamePlayerId(data.roomId, data.playerId);
      setGamePlayerDisplayNameForRoom(data.roomId, displayName.trim());
      setRoomIdForCricMatch(cricId, data.roomId);
      router.push(`/game/${data.roomId}`);
    } catch (x) {
      showAlert(x instanceof Error ? x.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-full bg-zinc-50 px-4 py-12 dark:bg-zinc-950">
      <AppAlertModal
        open={alertModal !== null}
        title={alertModal?.title ?? ""}
        message={alertModal?.message ?? ""}
        tone={alertModal?.tone}
        onClose={() => setAlertModal(null)}
      />
      <div className="mx-auto w-full max-w-lg space-y-8">
        <header className="text-center space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            IPL Dream11
          </h1>
          <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            Pick today&apos;s match, attach your Dream11 team screenshot, and join the leaderboard. We read your{" "}
            <strong className="text-zinc-800 dark:text-zinc-200">team points</strong> from the image (OCR).
          </p>
          <p className="text-sm">
            <Link
              href="/overall-leaderboard"
              prefetch={false}
              className="font-medium text-emerald-700 underline dark:text-emerald-400"
            >
              Overall Leaderboard
            </Link>
          </p>
        </header>

        {/* ── Active games ── */}
        {(activeRoomsLoading || activeRooms.length > 0) && (
          <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-6 space-y-3">
            <div>
              <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">Active games</h2>
              <p className="mt-1 text-xs text-zinc-500">Up to the 3 most recent ongoing matches.</p>
            </div>
            {activeRoomsLoading ? (
              <p className="text-sm text-zinc-500">Loading…</p>
            ) : (
              <ul className="space-y-3">
                {activeRooms.map((room) => (
                  <li
                    key={room.roomId}
                    className="flex flex-col gap-3 rounded-xl border border-zinc-200 px-3 py-3 dark:border-zinc-700 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-4"
                  >
                    <div className="min-w-0 sm:min-w-[8rem] sm:flex-1">
                      <p className="break-words font-medium leading-snug text-zinc-900 dark:text-zinc-100">
                        {room.label}
                      </p>
                      <p className="mt-0.5 text-xs text-zinc-500">
                        {room.playerCount} {room.playerCount === 1 ? "player" : "players"} joined
                      </p>
                    </div>
                    <div className="flex w-full flex-col gap-2 sm:w-auto sm:shrink-0 sm:flex-row sm:gap-2">
                      {storageReady && hasJoinedRoomAsDisplayName(room.roomId, displayName) ? (
                        <Link
                          href={`/game/${room.roomId}`}
                          className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 sm:min-h-0 sm:w-auto sm:py-2"
                        >
                          Go to Leaderboard
                        </Link>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedId(room.cricApiMatchId);
                              setSelectedLabel(room.label);
                              window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
                            }}
                            className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 sm:min-h-0 sm:w-auto sm:py-2"
                          >
                            Join &amp; upload
                          </button>
                          <Link
                            href={`/game/${room.roomId}`}
                            className="inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800 sm:min-h-0 sm:w-auto sm:py-2"
                          >
                            Leaderboard
                          </Link>
                        </>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        <form onSubmit={joinGame} className="space-y-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div>
            <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">IPL — today &amp; yesterday (IST)</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Matches are loaded from the bundled fixture list and limited to IST calendar today and yesterday.
            </p>
            <div className="mt-3 max-h-56 space-y-2 overflow-y-auto rounded-xl border border-zinc-200 p-2 dark:border-zinc-700">
              {matches.length === 0 ? (
                <p className="px-2 py-3 text-sm text-zinc-500">
                  No IPL fixtures for today or yesterday (IST).
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
                className="inline-flex cursor-pointer rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600 dark:bg-green-600 dark:hover:bg-green-500"
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
          </div>

          {joinedSelectedMatch && roomIdForSelectedMatch ? (
            <>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                You&apos;ve already joined this match on this device.
              </p>
              <Link
                href={`/game/${roomIdForSelectedMatch}`}
                className="flex w-full items-center justify-center rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                Go to Leaderboard
              </Link>
            </>
          ) : (
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {loading ? "Joining…" : "Join game"}
            </button>
          )}
        </form>

        <p className="text-center text-sm text-zinc-500">
          <Link href="/private" className="text-emerald-700 underline dark:text-emerald-400">
            Private leagues
          </Link>{" "}
          (create/join with a code) ·{" "}
          <Link href="/firebase" className="text-emerald-700 underline dark:text-emerald-400">
            Firebase (Data Connect)
          </Link>
        </p>
      </div>
    </div>
  );
}
