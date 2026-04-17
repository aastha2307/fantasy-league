"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { getGamePlayerId } from "@/lib/storage";

type Row = {
  playerId: string;
  displayName: string;
  total: number;
  ocrPoints: number | null;
  imagePath: string | null;
};

type Payload = {
  source: string;
  room: { id: string; label: string; cricApiMatchId: string };
  leaderboard: Row[];
  winner: { playerId: string; displayName: string; total: number } | null;
};

export default function GameLeaderboardPage() {
  const params = useParams();
  const raw = params.roomId;
  const roomId = typeof raw === "string" ? raw : Array.isArray(raw) ? raw[0] ?? "" : "";
  const [data, setData] = useState<Payload | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [err, setErr] = useState<string | null>(null);

  const [myId, setMyId] = useState<string | null>(null);
  const [manualPts, setManualPts] = useState("");
  const [savingPts, setSavingPts] = useState(false);
  const [reuploading, setReuploading] = useState(false);
  const [formMsg, setFormMsg] = useState<string | null>(null);
  const [formErr, setFormErr] = useState<string | null>(null);
  const manualInit = useRef(false);

  useEffect(() => {
    setMyId(getGamePlayerId(roomId));
  }, [roomId]);

  useEffect(() => {
    manualInit.current = false;
  }, [roomId]);

  const load = useCallback(async () => {
    if (!roomId) {
      setErr("Invalid game link.");
      return;
    }
    try {
      const res = await fetch(`/api/game/${roomId}/leaderboard`, { cache: "no-store" });
      if (!res.ok) {
        setErr("Could not load this game.");
        return;
      }
      const j = (await res.json()) as Payload;
      setData(j);
      setErr(null);
    } catch (e) {
      console.error("Leaderboard fetch failed:", e);
      setErr(e instanceof Error ? e.message : "Could not load this game.");
    }
  }, [roomId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!data || !myId || manualInit.current) return;
    const row = data.leaderboard.find((r) => r.playerId === myId);
    if (!row) return;
    manualInit.current = true;
    setManualPts(row.ocrPoints != null ? String(row.ocrPoints) : "");
  }, [data, myId]);

  function toggle(id: string) {
    setExpanded((e) => ({ ...e, [id]: !e[id] }));
  }

  async function saveManualPoints(e: React.FormEvent) {
    e.preventDefault();
    if (!myId) return;
    setSavingPts(true);
    setFormErr(null);
    setFormMsg(null);
    const raw = manualPts.trim();
    let value: number | null = null;
    if (raw !== "") {
      const n = parseFloat(raw);
      if (Number.isNaN(n) || n < 0) {
        setFormErr("Enter a valid number (or leave empty to clear).");
        setSavingPts(false);
        return;
      }
      value = Math.round(n * 100) / 100;
    }
    try {
      const res = await fetch(`/api/game/${roomId}/team`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId: myId, ocrPoints: value }),
      });
      const rawJson = (await res.json()) as { error?: string };
      if (!res.ok) {
        setFormErr(typeof rawJson.error === "string" ? rawJson.error : "Save failed");
        return;
      }
      setFormMsg("Points saved.");
      await load();
    } catch {
      setFormErr("Save failed");
    } finally {
      setSavingPts(false);
    }
  }

  async function onReplaceScreenshot(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !myId) return;
    setReuploading(true);
    setFormErr(null);
    setFormMsg(null);
    try {
      const fd = new FormData();
      fd.append("playerId", myId);
      fd.append("file", file);
      const res = await fetch(`/api/game/${roomId}/screenshot`, { method: "POST", body: fd });
      const j = (await res.json()) as { error?: string; ocrPoints?: number | null };
      if (!res.ok) {
        setFormErr(typeof j.error === "string" ? j.error : "Upload failed");
        return;
      }
      setFormMsg(
        j.ocrPoints != null
          ? `Screenshot updated — read ${j.ocrPoints} pts.`
          : "Screenshot updated — couldn’t read points; enter them manually."
      );
      e.target.value = "";
      await load();
    } catch {
      setFormErr("Upload failed");
    } finally {
      setReuploading(false);
    }
  }

  if (err || !data) {
    return (
      <div className="min-h-full bg-zinc-50 px-4 py-16 text-center dark:bg-zinc-950">
        <p className="text-zinc-600 dark:text-zinc-400">{err ?? "Loading…"}</p>
        <Link href="/" className="mt-4 inline-block text-emerald-700 underline dark:text-emerald-400">
          Home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-zinc-50 px-4 py-10 dark:bg-zinc-950">
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <Link href="/" className="text-sm text-emerald-700 hover:underline dark:text-emerald-400">
            ← Home
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{data.room.label}</h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Leaderboard uses <strong className="text-zinc-800 dark:text-zinc-200">team points</strong> read from
            each person&apos;s Dream11 screenshot (OCR). Wrong number? Fix it below or re-upload the image.
          </p>
          <button
            type="button"
            onClick={() => void load()}
            className="mt-2 rounded-lg border border-zinc-300 px-2 py-1 text-xs hover:bg-white dark:border-zinc-600 dark:hover:bg-zinc-900"
          >
            Refresh
          </button>
        </div>

        {data.winner && (
          <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100">
            <strong>{data.winner.displayName}</strong> is leading with{" "}
            <span className="font-mono tabular-nums">{data.winner.total.toFixed(2)}</span> pts.
          </p>
        )}

        {myId && (
          <section className="rounded-xl border border-emerald-200/80 bg-white p-4 shadow-sm dark:border-emerald-900/50 dark:bg-zinc-900">
            <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">Your points</h2>
            {formMsg && <p className="mt-2 text-sm text-emerald-800 dark:text-emerald-200">{formMsg}</p>}
            {formErr && <p className="mt-2 text-sm text-red-700 dark:text-red-300">{formErr}</p>}
            <form onSubmit={saveManualPoints} className="mt-3 flex flex-wrap items-end gap-3">
              <label className="block">
                <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">Fantasy points total</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={manualPts}
                  onChange={(e) => setManualPts(e.target.value)}
                  className="mt-1 w-40 rounded-lg border border-zinc-300 bg-white px-3 py-2 font-mono text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100"
                  placeholder="e.g. 487.5"
                />
              </label>
              <button
                type="submit"
                disabled={savingPts}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50 dark:bg-emerald-700 dark:hover:bg-emerald-600"
              >
                {savingPts ? "Saving…" : "Save"}
              </button>
            </form>
            <p className="mt-3 text-xs text-zinc-500">
              Leave empty and save to clear stored points. Use this if OCR misread your screenshot.
            </p>
            <div className="mt-4 border-t border-zinc-200 pt-4 dark:border-zinc-700">
              <label className="text-sm text-zinc-700 dark:text-zinc-300">
                Replace screenshot (re-run OCR)
                <input
                  type="file"
                  accept="image/*"
                  disabled={reuploading}
                  className="mt-2 block w-full text-sm"
                  onChange={(e) => void onReplaceScreenshot(e)}
                />
              </label>
              {reuploading ? <p className="mt-1 text-xs text-zinc-500">Processing…</p> : null}
            </div>
          </section>
        )}

        <section>
          <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">Leaderboard</h2>
          <p className="mt-1 text-sm text-zinc-500">Sorted by fantasy points. Prize money is shown for 1st and 2nd place.</p>

          <ul className="mt-4 space-y-2">
            {data.leaderboard.map((row, index) => {
              const isMe = myId === row.playerId;
              const isOpen = expanded[row.playerId] ?? false;
              const prize = index === 0 ? 120 : index === 1 ? 80 : null;
              return (
                <li
                  key={row.playerId}
                  className={`overflow-hidden rounded-xl border bg-white dark:bg-zinc-900 ${
                    isMe ? "border-emerald-400 ring-1 ring-emerald-400/30" : "border-zinc-200 dark:border-zinc-800"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggle(row.playerId)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/80"
                    aria-expanded={isOpen}
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-sm font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                      {index + 1}
                    </span>
                    {row.imagePath ? (
                      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700">
                        <Image src={row.imagePath} alt="" fill className="object-cover" unoptimized />
                      </div>
                    ) : (
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-xs text-zinc-400 dark:bg-zinc-800">
                        No img
                      </div>
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="font-medium text-zinc-900 dark:text-zinc-100">
                        {row.displayName}
                        {isMe ? (
                          <span className="ml-2 text-xs font-normal text-emerald-700 dark:text-emerald-400">
                            (you)
                          </span>
                        ) : null}
                      </span>
                      {row.ocrPoints == null && (
                        <span className="mt-0.5 block text-xs text-amber-700 dark:text-amber-400">
                          No points from screenshot — use home join with image or edit your total
                        </span>
                      )}
                    </span>
                    <span className="w-20 shrink-0 text-right">
                      {prize !== null ? (
                        <span className="inline-block rounded-lg bg-amber-50 px-2.5 py-1 font-mono text-sm font-semibold text-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
                          Rs {prize}
                        </span>
                      ) : (
                        <span className="text-xs text-zinc-400 dark:text-zinc-500">-</span>
                      )}
                    </span>
                    <span className="font-mono text-lg tabular-nums text-emerald-700 dark:text-emerald-400">
                      {row.total.toFixed(2)}
                    </span>
                    <svg
                      className={`h-5 w-5 shrink-0 text-zinc-500 transition-transform ${isOpen ? "rotate-180" : ""}`}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </button>

                  {isOpen && row.imagePath && (
                    <div className="border-t border-zinc-200 px-4 py-3 dark:border-zinc-800">
                      <div className="relative mx-auto aspect-[9/16] max-h-[min(70vh,520px)] w-full max-w-sm overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700">
                        <Image src={row.imagePath} alt="Dream11 screenshot" fill className="object-contain" unoptimized />
                      </div>
                    </div>
                  )}

                  {isOpen && !row.imagePath && (
                    <div className="border-t border-zinc-200 px-4 py-3 text-sm text-zinc-500 dark:border-zinc-800">
                      No screenshot uploaded.
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </section>

        <p className="text-center text-sm text-zinc-500">
          <Link href="/" className="text-emerald-700 underline dark:text-emerald-400">
            Join again as someone else
          </Link>{" "}
          (use a different name)
        </p>
      </div>
    </div>
  );
}
