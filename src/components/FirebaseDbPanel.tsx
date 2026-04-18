"use client";

import { useEffect, useState } from "react";
import { getDataConnect } from "firebase/data-connect";
import { connectorConfig, dcListHealth, type DcListHealthData } from "@ipl-fantasy/dataconnect";
import { firebaseApp } from "@/lib/firebase-client";

export function FirebaseDbPanel() {
  const [dc, setDc] = useState<DcListHealthData | null>(null);
  const [dcError, setDcError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const dataConnect = getDataConnect(firebaseApp, connectorConfig);
        const result = await dcListHealth(dataConnect, { limit: 5 });
        if (!cancelled) setDc(result.data);
      } catch (e) {
        if (!cancelled) {
          setDcError(e instanceof Error ? e.message : "Data Connect query failed");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 space-y-4">
      <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">Data Connect</h2>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        GraphQL health check via the generated client SDK.
      </p>

      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">DcHealth records</p>
        {dcError ? (
          <p className="text-sm text-amber-800 dark:text-amber-200">{dcError}</p>
        ) : loading ? (
          <p className="text-sm text-zinc-500">Loading…</p>
        ) : (
          <pre className="overflow-x-auto rounded-lg bg-zinc-100 p-3 text-xs text-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
            {JSON.stringify(dc, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}
