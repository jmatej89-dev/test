"use client";

import { useActionState, useEffect } from "react";
import {
  createPerson,
  updatePerson,
  type ContentFormState,
} from "@/app/actions/admin-content";

export type PersonRecord = {
  id: string;
  name: string;
  role: string;
  occupation: string | null;
  bio: string;
  photoUrl: string | null;
  isCulprit: boolean;
  sortOrder: number;
};

const ROLE_OPTIONS = [
  { value: "VICTIM", label: "Oběť" },
  { value: "SUSPECT", label: "Podezřelý" },
  { value: "WITNESS", label: "Svědek" },
  { value: "OTHER", label: "Jiná osoba" },
];

export function PersonForm({
  caseId,
  person,
  onDone,
}: {
  caseId: string;
  person?: PersonRecord;
  onDone?: () => void;
}) {
  const action = person ? updatePerson : createPerson;
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
      {person && <input type="hidden" name="personId" value={person.id} />}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-neutral-400">Jméno</label>
          <input
            name="name"
            required
            defaultValue={person?.name}
            className="rounded border border-neutral-700 bg-neutral-900 px-2 py-1.5 text-sm focus:border-amber-500 focus:outline-none"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-neutral-400">Role v případu</label>
          <select
            name="role"
            defaultValue={person?.role ?? "SUSPECT"}
            className="rounded border border-neutral-700 bg-neutral-900 px-2 py-1.5 text-sm focus:border-amber-500 focus:outline-none"
          >
            {ROLE_OPTIONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-neutral-400">
          Povolání / vztah k oběti (nepovinné)
        </label>
        <input
          name="occupation"
          defaultValue={person?.occupation ?? ""}
          className="rounded border border-neutral-700 bg-neutral-900 px-2 py-1.5 text-sm focus:border-amber-500 focus:outline-none"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-neutral-400">
          Popis (zobrazí se zákazníkovi ve Spisu)
        </label>
        <textarea
          name="bio"
          required
          rows={3}
          defaultValue={person?.bio}
          className="rounded border border-neutral-700 bg-neutral-900 px-2 py-1.5 text-sm focus:border-amber-500 focus:outline-none"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-neutral-400">
          URL fotografie (nepovinné, musí být na stejné doméně kvůli CSP)
        </label>
        <input
          name="photoUrl"
          defaultValue={person?.photoUrl ?? ""}
          className="rounded border border-neutral-700 bg-neutral-900 px-2 py-1.5 text-sm focus:border-amber-500 focus:outline-none"
        />
      </div>

      <label className="flex items-center gap-2 rounded border border-red-900 bg-red-950/30 px-3 py-2 text-sm">
        <input
          type="checkbox"
          name="isCulprit"
          defaultChecked={person?.isCulprit}
          className="accent-red-600"
        />
        <span>
          Toto je <strong>skutečný pachatel</strong> (nikdy se nezobrazí
          zákazníkovi, jen se používá k vyhodnocení obvinění)
        </span>
      </label>

      {state?.error && <p className="text-sm text-red-400">{state.error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded bg-amber-600 px-3 py-1.5 text-sm font-semibold text-neutral-950 hover:bg-amber-500 disabled:opacity-60"
        >
          {pending ? "Ukládám…" : person ? "Uložit změny" : "Přidat osobu"}
        </button>
        {onDone && (
          <button
            type="button"
            onClick={onDone}
            className="rounded border border-neutral-700 px-3 py-1.5 text-sm hover:border-neutral-500"
          >
            Zrušit
          </button>
        )}
      </div>
    </form>
  );
}
