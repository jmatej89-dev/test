"use client";

import { useState } from "react";
import { deleteWiretap } from "@/app/actions/admin-content";
import { WiretapForm, type WiretapRecord } from "./WiretapForm";

export function WiretapsManager({
  caseId,
  wiretaps,
}: {
  caseId: string;
  wiretaps: WiretapRecord[];
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  return (
    <div className="space-y-3">
      {wiretaps.map((w) =>
        editingId === w.id ? (
          <div
            key={w.id}
            className="rounded-lg border border-amber-800 bg-neutral-900/50 p-4"
          >
            <WiretapForm caseId={caseId} wiretap={w} onDone={() => setEditingId(null)} />
          </div>
        ) : (
          <div
            key={w.id}
            className="flex items-start justify-between gap-3 rounded-lg border border-neutral-800 bg-neutral-900/50 p-4"
          >
            <div>
              <span className="font-medium">{w.title}</span>
              <p className="mt-1 text-sm text-neutral-500">
                {w.audioUrl}
                {w.dateLabel ? ` · ${w.dateLabel}` : ""}
              </p>
              {w.participants && (
                <p className="mt-1 text-sm text-neutral-500">{w.participants}</p>
              )}
            </div>
            <div className="flex shrink-0 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setEditingId(w.id)}
                aria-label={`Upravit ${w.title}`}
                className="text-neutral-400 hover:text-neutral-100"
              >
                Upravit
              </button>
              <form action={deleteWiretap.bind(null, caseId, w.id)}>
                <button
                  type="submit"
                  aria-label={`Smazat ${w.title}`}
                  className="text-red-400 hover:text-red-300"
                >
                  Smazat
                </button>
              </form>
            </div>
          </div>
        ),
      )}

      {adding ? (
        <div className="rounded-lg border border-amber-800 bg-neutral-900/50 p-4">
          <WiretapForm caseId={caseId} onDone={() => setAdding(false)} />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="rounded border border-dashed border-neutral-700 px-3 py-2 text-sm text-neutral-400 hover:border-amber-500 hover:text-amber-500"
        >
          + Přidat odposlech
        </button>
      )}
    </div>
  );
}
