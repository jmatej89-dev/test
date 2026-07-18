"use client";

import { useActionState, useEffect } from "react";
import {
  createWiretap,
  updateWiretap,
  type ContentFormState,
} from "@/app/actions/admin-content";

export type WiretapRecord = {
  id: string;
  title: string;
  audioUrl: string;
  transcript: string | null;
  participants: string | null;
  dateLabel: string | null;
};

export function WiretapForm({
  caseId,
  wiretap,
  onDone,
}: {
  caseId: string;
  wiretap?: WiretapRecord;
  onDone?: () => void;
}) {
  const action = wiretap ? updateWiretap : createWiretap;
  const [state, formAction, pending] = useActionState<
    ContentFormState,
    FormData
  >(action, undefined);

  useEffect(() => {
    if (state?.ok) onDone?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="caseId" value={caseId} />
      {wiretap && <input type="hidden" name="wiretapId" value={wiretap.id} />}

      <div className="flex flex-col gap-1">
        <label className="text-xs text-ink-muted">Název</label>
        <input
          name="title"
          required
          defaultValue={wiretap?.title}
          className="rounded border border-line bg-navy-900 px-2 py-1.5 text-sm focus:border-accent focus:outline-none"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-ink-muted">
          URL audio souboru (musí být na stejné doméně kvůli CSP)
        </label>
        <input
          name="audioUrl"
          required
          defaultValue={wiretap?.audioUrl}
          placeholder="/audio/soubor.mp3"
          className="rounded border border-line bg-navy-900 px-2 py-1.5 text-sm focus:border-accent focus:outline-none"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-ink-muted">
            Účastníci (nepovinné)
          </label>
          <input
            name="participants"
            defaultValue={wiretap?.participants ?? ""}
            className="rounded border border-line bg-navy-900 px-2 py-1.5 text-sm focus:border-accent focus:outline-none"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-ink-muted">
            Datum/čas popisek (nepovinné)
          </label>
          <input
            name="dateLabel"
            defaultValue={wiretap?.dateLabel ?? ""}
            className="rounded border border-line bg-navy-900 px-2 py-1.5 text-sm focus:border-accent focus:outline-none"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-ink-muted">Přepis (nepovinné)</label>
        <textarea
          name="transcript"
          rows={4}
          defaultValue={wiretap?.transcript ?? ""}
          className="rounded border border-line bg-navy-900 px-2 py-1.5 font-mono text-sm focus:border-accent focus:outline-none"
        />
      </div>

      {state?.error && <p className="text-sm text-danger">{state.error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded bg-accent px-3 py-1.5 text-sm font-semibold text-navy-950 hover:bg-accent/90 disabled:opacity-60"
        >
          {pending ? "Ukládám…" : wiretap ? "Uložit změny" : "Přidat odposlech"}
        </button>
        {onDone && (
          <button
            type="button"
            onClick={onDone}
            className="rounded border border-line px-3 py-1.5 text-sm hover:border-ink-faint"
          >
            Zrušit
          </button>
        )}
      </div>
    </form>
  );
}
