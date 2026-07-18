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
  address: string | null;
  relationship: string | null;
  alibi: string | null;
  statement: string | null;
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
          <label className="text-xs text-ink-muted">Jméno</label>
          <input
            name="name"
            required
            defaultValue={person?.name}
            className="rounded border border-line bg-navy-900 px-2 py-1.5 text-sm focus:border-accent focus:outline-none"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-ink-muted">Role v případu</label>
          <select
            name="role"
            defaultValue={person?.role ?? "SUSPECT"}
            className="rounded border border-line bg-navy-900 px-2 py-1.5 text-sm focus:border-accent focus:outline-none"
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
        <label className="text-xs text-ink-muted">
          Povolání / vztah k oběti (nepovinné)
        </label>
        <input
          name="occupation"
          defaultValue={person?.occupation ?? ""}
          className="rounded border border-line bg-navy-900 px-2 py-1.5 text-sm focus:border-accent focus:outline-none"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-ink-muted">
          Popis (zobrazí se zákazníkovi ve Spisu)
        </label>
        <textarea
          name="bio"
          required
          rows={3}
          defaultValue={person?.bio}
          className="rounded border border-line bg-navy-900 px-2 py-1.5 text-sm focus:border-accent focus:outline-none"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-ink-muted">
          URL fotografie (nepovinné, musí být na stejné doméně kvůli CSP)
        </label>
        <input
          name="photoUrl"
          defaultValue={person?.photoUrl ?? ""}
          className="rounded border border-line bg-navy-900 px-2 py-1.5 text-sm focus:border-accent focus:outline-none"
        />
      </div>

      <div className="rounded border border-line-soft p-3">
        <p className="mb-3 text-xs tracking-wide text-ink-faint uppercase">
          Vyšetřovací údaje (databáze osob)
        </p>
        <div className="flex flex-col gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-ink-muted">
                Adresa / bydliště (nepovinné)
              </label>
              <input
                name="address"
                defaultValue={person?.address ?? ""}
                className="rounded border border-line bg-navy-900 px-2 py-1.5 text-sm focus:border-accent focus:outline-none"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-ink-muted">
                Vztah k oběti / ostatním (nepovinné)
              </label>
              <input
                name="relationship"
                defaultValue={person?.relationship ?? ""}
                className="rounded border border-line bg-navy-900 px-2 py-1.5 text-sm focus:border-accent focus:outline-none"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-ink-muted">
              Alibi (co osoba tvrdí, že dělala) — nepovinné
            </label>
            <textarea
              name="alibi"
              rows={2}
              defaultValue={person?.alibi ?? ""}
              className="rounded border border-line bg-navy-900 px-2 py-1.5 text-sm focus:border-accent focus:outline-none"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-ink-muted">
              Výpověď / citát z výslechu — nepovinné
            </label>
            <textarea
              name="statement"
              rows={2}
              defaultValue={person?.statement ?? ""}
              className="rounded border border-line bg-navy-900 px-2 py-1.5 text-sm focus:border-accent focus:outline-none"
            />
          </div>
        </div>
      </div>

      <label className="flex items-center gap-2 rounded border border-danger/40 bg-danger-bg px-3 py-2 text-sm">
        <input
          type="checkbox"
          name="isCulprit"
          defaultChecked={person?.isCulprit}
          className="accent-danger"
        />
        <span>
          Toto je <strong>skutečný pachatel</strong> (nikdy se nezobrazí
          zákazníkovi, jen se používá k vyhodnocení obvinění)
        </span>
      </label>

      {state?.error && <p className="text-sm text-danger">{state.error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded bg-accent px-3 py-1.5 text-sm font-semibold text-navy-950 hover:bg-accent/90 disabled:opacity-60"
        >
          {pending ? "Ukládám…" : person ? "Uložit změny" : "Přidat osobu"}
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
