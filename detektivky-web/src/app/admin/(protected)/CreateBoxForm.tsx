"use client";

import { useActionState } from "react";
import { createBox, type CreateBoxFormState } from "@/app/actions/admin";

type CaseOption = { id: string; title: string };

export function CreateBoxForm({ cases }: { cases: CaseOption[] }) {
  const [state, action, pending] = useActionState<
    CreateBoxFormState,
    FormData
  >(createBox, undefined);

  if (state && "credentials" in state) {
    return (
      <div className="rounded-lg border border-amber-700 bg-amber-950/30 p-4">
        <p className="font-semibold text-amber-400">
          Krabice vytvořena — poznamenejte si přihlašovací údaje.
        </p>
        <p className="mt-1 text-sm text-neutral-400">
          Heslo se z bezpečnostních důvodů už nikde nezobrazí. Vytiskněte ho
          na kartičku do krabice hned teď.
        </p>
        <dl className="mt-3 space-y-1 font-mono text-sm">
          <div>
            <dt className="inline text-neutral-500">Kód: </dt>
            <dd className="inline">{state.credentials.code}</dd>
          </div>
          <div>
            <dt className="inline text-neutral-500">Heslo: </dt>
            <dd className="inline">{state.credentials.password}</dd>
          </div>
        </dl>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1">
        <label className="text-sm text-neutral-400" htmlFor="caseId">
          Případ
        </label>
        <select
          id="caseId"
          name="caseId"
          required
          className="rounded border border-neutral-700 bg-neutral-900 px-3 py-2 focus:border-amber-500 focus:outline-none"
        >
          <option value="">— vyberte —</option>
          {cases.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm text-neutral-400" htmlFor="customerLabel">
          Interní poznámka (objednávka, zákazník…)
        </label>
        <input
          id="customerLabel"
          name="customerLabel"
          className="rounded border border-neutral-700 bg-neutral-900 px-3 py-2 focus:border-amber-500 focus:outline-none"
        />
      </div>
      {state && "error" in state && (
        <p className="w-full text-sm text-red-400">{state.error}</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-neutral-100 px-4 py-2 font-semibold text-neutral-950 hover:bg-white disabled:opacity-60"
      >
        {pending ? "Generuji…" : "Vygenerovat novou krabici"}
      </button>
    </form>
  );
}
