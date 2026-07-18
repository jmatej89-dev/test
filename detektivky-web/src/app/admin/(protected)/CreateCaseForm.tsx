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
          <label className="text-sm text-ink-muted" htmlFor="title">
            Název případu
          </label>
          <input
            id="title"
            name="title"
            required
            className="rounded border border-line bg-navy-900 px-3 py-2 focus:border-accent focus:outline-none"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm text-ink-muted" htmlFor="slug">
            Slug (URL)
          </label>
          <input
            id="slug"
            name="slug"
            placeholder="napr-vrazda-na-zamku"
            required
            className="rounded border border-line bg-navy-900 px-3 py-2 font-mono text-sm focus:border-accent focus:outline-none"
          />
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm text-ink-muted" htmlFor="subtitle">
          Podtitul (nepovinné)
        </label>
        <input
          id="subtitle"
          name="subtitle"
          className="rounded border border-line bg-navy-900 px-3 py-2 focus:border-accent focus:outline-none"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm text-ink-muted" htmlFor="teaser">
          Krátký popisek na kartu v nabídce (nepovinné)
        </label>
        <input
          id="teaser"
          name="teaser"
          placeholder="Jedna nebo dvě věty, které zákazníka nalákají."
          className="rounded border border-line bg-navy-900 px-3 py-2 focus:border-accent focus:outline-none"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm text-ink-muted" htmlFor="description">
          Úvod případu (zobrazí se ve Spisu)
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          required
          className="rounded border border-line bg-navy-900 px-3 py-2 focus:border-accent focus:outline-none"
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="flex flex-col gap-1">
          <label className="text-sm text-ink-muted" htmlFor="difficulty">
            Obtížnost (1–5)
          </label>
          <input
            id="difficulty"
            name="difficulty"
            type="number"
            min={1}
            max={5}
            defaultValue={1}
            className="rounded border border-line bg-navy-900 px-3 py-2 focus:border-accent focus:outline-none"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm text-ink-muted" htmlFor="priceCzk">
            Cena v Kč (nepovinné)
          </label>
          <input
            id="priceCzk"
            name="priceCzk"
            type="number"
            min={0}
            placeholder="1490"
            className="rounded border border-line bg-navy-900 px-3 py-2 focus:border-accent focus:outline-none"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm text-ink-muted" htmlFor="coverImageUrl">
            URL obrázku na kartu (nepovinné)
          </label>
          <input
            id="coverImageUrl"
            name="coverImageUrl"
            className="rounded border border-line bg-navy-900 px-3 py-2 focus:border-accent focus:outline-none"
          />
        </div>
      </div>
      {state?.error && <p className="text-sm text-danger">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="self-start rounded bg-accent px-4 py-2 font-semibold text-navy-950 hover:bg-accent/90 disabled:opacity-60"
      >
        {pending ? "Vytvářím…" : "Vytvořit případ"}
      </button>
    </form>
  );
}
