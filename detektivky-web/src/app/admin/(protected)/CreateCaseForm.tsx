"use client";

import { useActionState } from "react";
import { createCase, type CreateCaseFormState } from "@/app/actions/admin";

export function CreateCaseForm() {
  const [state, action, pending] = useActionState<
    CreateCaseFormState,
    FormData
  >(createCase, undefined);

  return (
    <form action={action} className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label className="text-sm text-neutral-400" htmlFor="title">
            Název případu
          </label>
          <input
            id="title"
            name="title"
            required
            className="rounded border border-neutral-700 bg-neutral-900 px-3 py-2 focus:border-amber-500 focus:outline-none"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm text-neutral-400" htmlFor="slug">
            Slug (URL)
          </label>
          <input
            id="slug"
            name="slug"
            placeholder="napr-vrazda-na-zamku"
            required
            className="rounded border border-neutral-700 bg-neutral-900 px-3 py-2 font-mono text-sm focus:border-amber-500 focus:outline-none"
          />
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm text-neutral-400" htmlFor="subtitle">
          Podtitul (nepovinné)
        </label>
        <input
          id="subtitle"
          name="subtitle"
          className="rounded border border-neutral-700 bg-neutral-900 px-3 py-2 focus:border-amber-500 focus:outline-none"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm text-neutral-400" htmlFor="description">
          Úvod případu (zobrazí se ve Spisu)
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          required
          className="rounded border border-neutral-700 bg-neutral-900 px-3 py-2 focus:border-amber-500 focus:outline-none"
        />
      </div>
      <div className="flex flex-col gap-1 sm:w-40">
        <label className="text-sm text-neutral-400" htmlFor="difficulty">
          Obtížnost (1–5)
        </label>
        <input
          id="difficulty"
          name="difficulty"
          type="number"
          min={1}
          max={5}
          defaultValue={1}
          className="rounded border border-neutral-700 bg-neutral-900 px-3 py-2 focus:border-amber-500 focus:outline-none"
        />
      </div>
      {state?.error && <p className="text-sm text-red-400">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="self-start rounded bg-amber-600 px-4 py-2 font-semibold text-neutral-950 hover:bg-amber-500 disabled:opacity-60"
      >
        {pending ? "Vytvářím…" : "Vytvořit případ"}
      </button>
    </form>
  );
}
