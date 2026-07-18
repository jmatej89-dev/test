"use client";

import { useActionState } from "react";
import { updateCase, type UpdateCaseFormState } from "@/app/actions/admin";

export type CaseRecord = {
  id: string;
  title: string;
  subtitle: string | null;
  description: string;
  difficulty: number;
};

export function CaseEditForm({ record }: { record: CaseRecord }) {
  const [state, action, pending] = useActionState<
    UpdateCaseFormState,
    FormData
  >(updateCase, undefined);

  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="caseId" value={record.id} />
      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-ink-muted">Název</label>
          <input
            name="title"
            required
            defaultValue={record.title}
            className="rounded border border-line bg-navy-900 px-2 py-1.5 text-sm focus:border-accent focus:outline-none"
          />
        </div>
        <div className="flex flex-col gap-1 sm:w-28">
          <label className="text-xs text-ink-muted">Obtížnost</label>
          <input
            name="difficulty"
            type="number"
            min={1}
            max={5}
            defaultValue={record.difficulty}
            className="rounded border border-line bg-navy-900 px-2 py-1.5 text-sm focus:border-accent focus:outline-none"
          />
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-ink-muted">Podtitul</label>
        <input
          name="subtitle"
          defaultValue={record.subtitle ?? ""}
          className="rounded border border-line bg-navy-900 px-2 py-1.5 text-sm focus:border-accent focus:outline-none"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-ink-muted">Úvod (Spis)</label>
        <textarea
          name="description"
          required
          rows={4}
          defaultValue={record.description}
          className="rounded border border-line bg-navy-900 px-2 py-1.5 text-sm focus:border-accent focus:outline-none"
        />
      </div>
      {state?.error && <p className="text-sm text-danger">{state.error}</p>}
      {state?.ok && <p className="text-sm text-success">Uloženo.</p>}
      <button
        type="submit"
        disabled={pending}
        className="self-start rounded bg-white px-4 py-1.5 text-sm font-semibold text-navy-950 hover:bg-white/90 disabled:opacity-60"
      >
        {pending ? "Ukládám…" : "Uložit"}
      </button>
    </form>
  );
}
