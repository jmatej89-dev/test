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
          <label className="text-xs text-neutral-400">Název</label>
          <input
            name="title"
            required
            defaultValue={record.title}
            className="rounded border border-neutral-700 bg-neutral-900 px-2 py-1.5 text-sm focus:border-amber-500 focus:outline-none"
          />
        </div>
        <div className="flex flex-col gap-1 sm:w-28">
          <label className="text-xs text-neutral-400">Obtížnost</label>
          <input
            name="difficulty"
            type="number"
            min={1}
            max={5}
            defaultValue={record.difficulty}
            className="rounded border border-neutral-700 bg-neutral-900 px-2 py-1.5 text-sm focus:border-amber-500 focus:outline-none"
          />
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-neutral-400">Podtitul</label>
        <input
          name="subtitle"
          defaultValue={record.subtitle ?? ""}
          className="rounded border border-neutral-700 bg-neutral-900 px-2 py-1.5 text-sm focus:border-amber-500 focus:outline-none"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-neutral-400">Úvod (Spis)</label>
        <textarea
          name="description"
          required
          rows={4}
          defaultValue={record.description}
          className="rounded border border-neutral-700 bg-neutral-900 px-2 py-1.5 text-sm focus:border-amber-500 focus:outline-none"
        />
      </div>
      {state?.error && <p className="text-sm text-red-400">{state.error}</p>}
      {state?.ok && <p className="text-sm text-green-400">Uloženo.</p>}
      <button
        type="submit"
        disabled={pending}
        className="self-start rounded bg-amber-600 px-4 py-1.5 text-sm font-semibold text-neutral-950 hover:bg-amber-500 disabled:opacity-60"
      >
        {pending ? "Ukládám…" : "Uložit"}
      </button>
    </form>
  );
}
