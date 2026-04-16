"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { getMemberId } from "@/lib/storage";
import type { TeamPlayers } from "@/lib/scoring";

type LivePlayerRow = {
  name: string;
  role: string;
  basePoints: number;
  points: number;
  matched: boolean;
};

type LeaderRow = {
  memberId: string;
  memberName: string;
  total: number;
  submissionId: string | null;
  hasTeam: boolean;
  players: LivePlayerRow[];
};

type LivePayload = {
  source: "live" | "manual" | "none";
  cricApiMatchId: string | null;
  apiStatus: string | null;
  apiError: string | null;
  pointsRows: { playerName: string; points: number }[];
  leaderboard: LeaderRow[];
  winner: { memberId: string; memberName: string; total: number } | null;
};

type CricMatch = { id: string; name: string; status: string };

export default function MatchPage() {
  const params = useParams();
  const router = useRouter();
  const leagueId = params.id as string;
  const matchId = params.matchId as string;

  const [memberId, setMemberIdState] = useState<string | null>(null);
  const [matchLabel, setMatchLabel] = useState("");
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [imagePath, setImagePath] = useState<string | null>(null);
  const [ocrText, setOcrText] = useState("");
  const [playersLines, setPlayersLines] = useState("");
  const [captain, setCaptain] = useState("");
  const [vice, setVice] = useState("");
  const [pointsCsv, setPointsCsv] = useState("");
  const [live, setLive] = useState<LivePayload | null>(null);
  const [cricMatches, setCricMatches] = useState<CricMatch[]>([]);
  const [pickId, setPickId] = useState("");
  const [manualId, setManualId] = useState("");
  const [linking, setLinking] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [playingXiOpen, setPlayingXiOpen] = useState(false);

  const loadLive = useCallback(async () => {
    const res = await fetch(`/api/matches/${matchId}/live`);
    if (!res.ok) return;
    const data = (await res.json()) as LivePayload;
    setLive(data);
  }, [matchId]);

  useEffect(() => {
    const mid = getMemberId(leagueId);
    if (!mid) {
      router.replace("/");
      return;
    }
    setMemberIdState(mid);
    void (async () => {
      const draft = await fetch(`/api/matches/${matchId}/draft`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId: mid }),
      });
      if (!draft.ok) {
        router.replace(`/league/${leagueId}`);
        return;
      }
      const { submission } = await draft.json();
      setSubmissionId(submission.id);
      setImagePath(submission.imagePath);
      setOcrText(submission.ocrText ?? "");
      try {
        const t = JSON.parse(submission.playersJson) as TeamPlayers;
        setPlayersLines((t.players ?? []).join("\n"));
        setCaptain(t.captain ?? "");
        setVice(t.viceCaptain ?? "");
        if ((t.players ?? []).length > 0) setPlayingXiOpen(true);
      } catch {
        /* empty */
      }
      const meta = await fetch(`/api/matches/${matchId}`);
      if (meta.ok) {
        const m = await meta.json();
        setMatchLabel(m.label ?? "");
        if (m.cricApiMatchId) setManualId(m.cricApiMatchId);
      }
      await loadLive();
      const cm = await fetch("/api/cricket/current-matches");
      const cmj = await cm.json();
      if (Array.isArray(cmj.matches)) setCricMatches(cmj.matches);
    })();
  }, [leagueId, matchId, router, loadLive]);

  useEffect(() => {
    if (!live?.cricApiMatchId) return;
    const t = window.setInterval(() => void loadLive(), 45_000);
    return () => window.clearInterval(t);
  }, [live?.cricApiMatchId, loadLive]);

  async function linkLive(e: React.FormEvent) {
    e.preventDefault();
    if (!memberId) return;
    const id = (manualId || pickId).trim();
    if (!id) {
      setErr("Pick a match or paste a Cricket Data match id.");
      return;
    }
    setLinking(true);
    setErr(null);
    const res = await fetch(`/api/matches/${matchId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberId, cricApiMatchId: id }),
    });
    const data = await res.json();
    setLinking(false);
    if (!res.ok) {
      setErr(data.error ?? "Could not link match");
      return;
    }
    setMsg("Live match linked. Scores refresh about every 45s while this page is open.");
    await loadLive();
  }

  async function unlinkLive() {
    if (!memberId) return;
    setLinking(true);
    const res = await fetch(`/api/matches/${matchId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberId, cricApiMatchId: null }),
    });
    setLinking(false);
    if (res.ok) {
      setManualId("");
      setPickId("");
      setMsg("Live link cleared. Using manual points if any.");
      await loadLive();
    }
  }

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !memberId) return;
    setUploading(true);
    setErr(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("matchId", matchId);
      fd.append("memberId", memberId);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      setSubmissionId(data.submission.id);
      setImagePath(data.submission.imagePath);
      setOcrText(data.submission.ocrText ?? "");
      try {
        const t = JSON.parse(data.submission.playersJson as string) as TeamPlayers;
        const n = (t.players ?? []).length;
        setPlayersLines((t.players ?? []).join("\n"));
        setCaptain(t.captain ?? "");
        setVice(t.viceCaptain ?? "");
        if (n > 0) {
          setPlayingXiOpen(true);
          setMsg(
            `Found ${n} player name${n === 1 ? "" : "s"} from the screenshot. Review below and tap Save team.`
          );
        } else {
          setMsg(
            "Could not auto-detect player names from OCR. Use the raw text below to type your XI, or edit the list."
          );
        }
      } catch {
        setMsg("Screenshot saved. Add your playing XI below.");
      }
    } catch (x) {
      setErr(x instanceof Error ? x.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function saveTeam(e: React.FormEvent) {
    e.preventDefault();
    if (!submissionId || !memberId) return;
    setSaving(true);
    setErr(null);
    const players = playersLines
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    const body: TeamPlayers = { players, captain: captain.trim(), viceCaptain: vice.trim() };
    const res = await fetch(`/api/teams/${submissionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberId, playersJson: JSON.stringify(body) }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setErr(data.error ?? "Save failed");
      return;
    }
    setMsg("Team saved.");
    await loadLive();
  }

  async function savePoints(e: React.FormEvent) {
    e.preventDefault();
    if (!memberId) return;
    setErr(null);
    const res = await fetch(`/api/matches/${matchId}/points`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberId, csv: pointsCsv }),
    });
    const data = await res.json();
    if (!res.ok) {
      setErr(data.error ?? "Could not save points");
      return;
    }
    setMsg(`Saved manual fantasy points for ${data.count} players.`);
    await loadLive();
  }

  const mine = live?.leaderboard.find((r) => r.memberId === memberId);
  const winner = live?.winner;

  return (
    <div className="min-h-full bg-zinc-50 px-4 py-10 dark:bg-zinc-950">
      <div className="mx-auto max-w-3xl space-y-8">
        <div>
          <Link
            href={`/league/${leagueId}`}
            className="text-sm text-emerald-700 hover:underline dark:text-emerald-400"
          >
            ← {matchLabel || "League"}
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            {matchLabel || "Match"}
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Link a live IPL fixture via the Cricket Data API (free key at cricapi.com). Points update from
            ball-by-ball scorecards while the match is on. Captain ×2 and vice-captain ×1.5. Fantasy points
            use a Dream11-style formula (approximate). Or paste official Dream11 points below if you prefer.
          </p>
        </div>

        {msg && (
          <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
            {msg}
          </p>
        )}
        {err && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
            {err}
          </p>
        )}

        <section className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">Live match (Cricket Data)</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Cricbuzz does not expose a public API. This app uses{" "}
            <a
              className="text-emerald-700 underline dark:text-emerald-400"
              href="https://www.cricapi.com/"
              target="_blank"
              rel="noreferrer"
            >
              Cricket Data (CricAPI)
            </a>{" "}
            — add <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">CRICKET_API_KEY</code> to{" "}
            <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">.env</code> on the server, restart{" "}
            <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">npm run dev</code>, then pick the IPL
            match here.
          </p>

          {live?.apiError && (
            <p className="mt-3 text-sm text-amber-800 dark:text-amber-200">{live.apiError}</p>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
            <span>
              Mode:{" "}
              <strong className="text-zinc-900 dark:text-zinc-100">
                {live?.source === "live"
                  ? "Live scorecard"
                  : live?.source === "manual"
                    ? "Manual CSV"
                    : "No points yet"}
              </strong>
            </span>
            {live?.apiStatus ? (
              <span className="rounded-full bg-zinc-100 px-2 py-0.5 dark:bg-zinc-800">{live.apiStatus}</span>
            ) : null}
            <button
              type="button"
              onClick={() => void loadLive()}
              className="rounded-lg border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-50 dark:border-zinc-600 dark:hover:bg-zinc-800"
            >
              Refresh now
            </button>
          </div>

          <form onSubmit={linkLive} className="mt-4 space-y-3">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Current &amp; recent matches
              <select
                className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
                value={pickId}
                onChange={(e) => {
                  setPickId(e.target.value);
                  setManualId(e.target.value);
                }}
              >
                <option value="">— Select —</option>
                {cricMatches.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.status})
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Or paste Cricket Data match id
              <input
                className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 font-mono text-sm dark:border-zinc-600 dark:bg-zinc-950"
                value={manualId}
                onChange={(e) => setManualId(e.target.value)}
                placeholder="e.g. from API / currentMatches response"
              />
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                disabled={linking}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {linking ? "Saving…" : "Save live link"}
              </button>
              <button
                type="button"
                disabled={linking}
                onClick={() => void unlinkLive()}
                className="rounded-lg border border-zinc-300 px-4 py-2 text-sm text-zinc-800 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                Clear link
              </button>
            </div>
          </form>
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">Your screenshot</h2>
          <p className="mt-1 text-sm text-zinc-500">PNG or JPG from the Dream11 app.</p>
          <input
            type="file"
            accept="image/*"
            className="mt-3 block w-full text-sm"
            disabled={uploading}
            onChange={(e) => void onUpload(e)}
          />
          {uploading && <p className="mt-2 text-sm text-zinc-500">Reading image… (can take a minute)</p>}
          {imagePath && (
            <div className="relative mt-4 aspect-[9/16] max-h-80 w-full max-w-sm overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700">
              <Image src={imagePath} alt="Your team" fill className="object-contain" unoptimized />
            </div>
          )}
        </section>

        {ocrText ? (
          <section className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">OCR text</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Raw text from the image. Names are also parsed into your playing XI when possible.
            </p>
            <pre className="mt-3 max-h-48 overflow-auto rounded-lg bg-zinc-100 p-3 text-xs text-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
              {ocrText}
            </pre>
          </section>
        ) : null}

        <section className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">Manual Dream11 points (optional)</h2>
          <p className="mt-1 text-sm text-zinc-500">
            If you are not using live scoring, paste official points here. When live scoring works, it takes
            precedence.
          </p>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Rows loaded: <strong>{live?.pointsRows.length ?? 0}</strong>
          </p>
          <form onSubmit={savePoints} className="mt-4 space-y-3">
            <textarea
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 font-mono text-sm dark:border-zinc-600 dark:bg-zinc-950"
              rows={8}
              value={pointsCsv}
              onChange={(e) => setPointsCsv(e.target.value)}
              placeholder={"Rohit Sharma, 45\nVirat Kohli, 62\n..."}
            />
            <button
              type="submit"
              className="rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-900 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
            >
              Save manual points
            </button>
          </form>
        </section>

        <section>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">Leaderboard</h2>
            {winner && (
              <p className="text-sm text-emerald-800 dark:text-emerald-300">
                Leader: <strong>{winner.memberName}</strong> ({winner.total.toFixed(2)} pts)
              </p>
            )}
          </div>
          <ol className="mt-3 divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
            {(live?.leaderboard ?? []).map((row, i) => {
              const isWinner = Boolean(winner && row.hasTeam && row.memberId === winner.memberId);
              return (
                <li key={row.memberId} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <span className="flex flex-wrap items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-sm font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                      {i + 1}
                    </span>
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">{row.memberName}</span>
                    {isWinner ? (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900 dark:bg-amber-900/40 dark:text-amber-100">
                        Winning
                      </span>
                    ) : null}
                    {!row.hasTeam && (
                      <span className="text-xs text-amber-700 dark:text-amber-400">No lineup yet</span>
                    )}
                  </span>
                  <span className="font-mono text-lg tabular-nums text-emerald-700 dark:text-emerald-400">
                    {row.total.toFixed(2)}
                  </span>
                </li>
              );
            })}
          </ol>
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <button
            type="button"
            onClick={() => setPlayingXiOpen((o) => !o)}
            className="flex w-full items-start justify-between gap-3 rounded-2xl p-6 text-left transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/80"
            aria-expanded={playingXiOpen}
          >
            <div>
              <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">Your playing XI</h2>
              <p className="mt-1 text-sm text-zinc-500">
                One player per line (filled from screenshot when OCR can read them). Set captain and
                vice-captain to match Dream11.
              </p>
            </div>
            <span className="mt-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
              <svg
                className={`h-5 w-5 transition-transform ${playingXiOpen ? "rotate-180" : ""}`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </span>
          </button>

          {playingXiOpen ? (
            <div className="border-t border-zinc-200 px-6 pb-6 pt-2 dark:border-zinc-800">
              <form onSubmit={saveTeam} className="space-y-3">
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Players
                  <textarea
                    className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 font-mono text-sm dark:border-zinc-600 dark:bg-zinc-950"
                    rows={12}
                    value={playersLines}
                    onChange={(e) => setPlayersLines(e.target.value)}
                    placeholder={"Rohit Sharma\nVirat Kohli\n..."}
                  />
                </label>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Captain (×2)
                    <input
                      className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950"
                      value={captain}
                      onChange={(e) => setCaptain(e.target.value)}
                      placeholder="Must match a line above"
                    />
                  </label>
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Vice-captain (×1.5)
                    <input
                      className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950"
                      value={vice}
                      onChange={(e) => setVice(e.target.value)}
                    />
                  </label>
                </div>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {saving ? "Saving…" : "Save team"}
                </button>
              </form>
            </div>
          ) : null}
        </section>

        {mine && mine.players.length > 0 && (
          <section className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-6 dark:border-emerald-900 dark:bg-emerald-950/20">
            <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">Your fantasy points (this match)</h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Base points from the feed; total includes captain / vice multipliers.
            </p>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-emerald-200 dark:border-emerald-800">
                    <th className="py-2 pr-2">Player</th>
                    <th className="py-2 pr-2">Role</th>
                    <th className="py-2 pr-2">Base</th>
                    <th className="py-2">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {mine.players.map((p) => (
                    <tr key={p.name} className="border-b border-emerald-100/80 dark:border-emerald-900/50">
                      <td className="py-2 pr-2">
                        {p.name}
                        {!p.matched && (
                          <span className="ml-2 text-xs text-amber-700 dark:text-amber-400">no match</span>
                        )}
                      </td>
                      <td className="py-2 pr-2 font-mono text-xs uppercase">{p.role}</td>
                      <td className="py-2 pr-2 tabular-nums">{p.basePoints.toFixed(2)}</td>
                      <td className="py-2 font-medium tabular-nums text-emerald-800 dark:text-emerald-300">
                        {p.points.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={3} className="pt-3 font-medium">
                      Team total
                    </td>
                    <td className="pt-3 font-mono text-lg font-semibold tabular-nums text-emerald-800 dark:text-emerald-300">
                      {mine.total.toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
