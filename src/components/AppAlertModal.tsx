"use client";

import { useEffect, useId, useRef } from "react";

export type AppAlertModalTone = "error" | "neutral";

type Props = {
  open: boolean;
  title: string;
  message: string;
  tone?: AppAlertModalTone;
  confirmLabel?: string;
  onClose: () => void;
};

export function AppAlertModal({
  open,
  title,
  message,
  tone = "error",
  confirmLabel = "OK",
  onClose,
}: Props) {
  const titleId = useId();
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    confirmRef.current?.focus();
  }, [open]);

  if (!open) return null;

  const panelRing =
    tone === "error"
      ? "border-red-200 dark:border-red-800/80"
      : "border-zinc-200 dark:border-zinc-700";

  const titleClass =
    tone === "error" ? "text-red-900 dark:text-red-100" : "text-zinc-900 dark:text-zinc-50";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-[1px]"
        aria-label="Dismiss dialog"
        onClick={onClose}
      />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`relative w-full max-w-md rounded-2xl border bg-white p-6 shadow-xl dark:bg-zinc-900 ${panelRing}`}
      >
        <h2 id={titleId} className={`text-lg font-semibold ${titleClass}`}>
          {title}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300 whitespace-pre-wrap">
          {message}
        </p>
        <button
          ref={confirmRef}
          type="button"
          onClick={onClose}
          className="mt-6 w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
        >
          {confirmLabel}
        </button>
      </div>
    </div>
  );
}
