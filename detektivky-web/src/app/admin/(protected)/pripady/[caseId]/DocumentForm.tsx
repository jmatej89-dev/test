"use client";

import { useActionState, useEffect } from "react";
import {
  createDocument,
  updateDocument,
  type ContentFormState,
} from "@/app/actions/admin-content";

export type DocumentRecord = {
  id: string;
  title: string;
  type: string;
  url: string | null;
  content: string | null;
  description: string | null;
};

const TYPE_OPTIONS = [
  { value: "NOTE", label: "Poznámka / protokol (text)" },
  { value: "PHOTO", label: "Fotografie (URL)" },
  { value: "PDF", label: "Dokument PDF (URL)" },
];

export function DocumentForm({
  caseId,
  document,
  onDone,
}: {
  caseId: string;
  document?: DocumentRecord;
  onDone?: () => void;
}) {
  const action = document ? updateDocument : createDocument;
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
      {document && <input type="hidden" name="documentId" value={document.id} />}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-ink-muted">Název</label>
          <input
            name="title"
            required
            defaultValue={document?.title}
            className="rounded border border-line bg-navy-900 px-2 py-1.5 text-sm focus:border-accent focus:outline-none"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-ink-muted">Typ</label>
          <select
            name="type"
            defaultValue={document?.type ?? "NOTE"}
            className="rounded border border-line bg-navy-900 px-2 py-1.5 text-sm focus:border-accent focus:outline-none"
          >
            {TYPE_OPTIONS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-ink-muted">
          URL souboru (pro fotografii/PDF, musí být na stejné doméně kvůli CSP)
        </label>
        <input
          name="url"
          defaultValue={document?.url ?? ""}
          className="rounded border border-line bg-navy-900 px-2 py-1.5 text-sm focus:border-accent focus:outline-none"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-ink-muted">
          Text (pro poznámku/protokol)
        </label>
        <textarea
          name="content"
          rows={4}
          defaultValue={document?.content ?? ""}
          className="rounded border border-line bg-navy-900 px-2 py-1.5 font-mono text-sm focus:border-accent focus:outline-none"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-ink-muted">
          Krátký popisek (nepovinné)
        </label>
        <input
          name="description"
          defaultValue={document?.description ?? ""}
          className="rounded border border-line bg-navy-900 px-2 py-1.5 text-sm focus:border-accent focus:outline-none"
        />
      </div>

      {state?.error && <p className="text-sm text-danger">{state.error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded bg-white px-3 py-1.5 text-sm font-semibold text-navy-950 hover:bg-white/90 disabled:opacity-60"
        >
          {pending ? "Ukládám…" : document ? "Uložit změny" : "Přidat důkaz"}
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
