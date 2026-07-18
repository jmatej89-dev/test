"use client";

import { useActionState, useEffect } from "react";
import {
  createEmail,
  updateEmail,
  type ContentFormState,
} from "@/app/actions/admin-content";

export type EmailRecord = {
  id: string;
  fromPersonId: string | null;
  toPersonId: string | null;
  subject: string;
  body: string;
  dateLabel: string | null;
};

type PersonOption = { id: string; name: string };

export function EmailForm({
  caseId,
  email,
  persons,
  onDone,
}: {
  caseId: string;
  email?: EmailRecord;
  persons: PersonOption[];
  onDone?: () => void;
}) {
  const action = email ? updateEmail : createEmail;
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
      {email && <input type="hidden" name="emailId" value={email.id} />}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-ink-muted">Od</label>
          <select
            name="fromPersonId"
            defaultValue={email?.fromPersonId ?? ""}
            className="rounded border border-line bg-navy-900 px-2 py-1.5 text-sm focus:border-accent focus:outline-none"
          >
            <option value="">— neznámý —</option>
            {persons.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-ink-muted">Komu</label>
          <select
            name="toPersonId"
            defaultValue={email?.toPersonId ?? ""}
            className="rounded border border-line bg-navy-900 px-2 py-1.5 text-sm focus:border-accent focus:outline-none"
          >
            <option value="">— neznámý —</option>
            {persons.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-ink-muted">Předmět</label>
        <input
          name="subject"
          required
          defaultValue={email?.subject}
          className="rounded border border-line bg-navy-900 px-2 py-1.5 text-sm focus:border-accent focus:outline-none"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-ink-muted">Text e-mailu</label>
        <textarea
          name="body"
          required
          rows={4}
          defaultValue={email?.body}
          className="rounded border border-line bg-navy-900 px-2 py-1.5 text-sm focus:border-accent focus:outline-none"
        />
      </div>

      <div className="flex flex-col gap-1 sm:w-48">
        <label className="text-xs text-ink-muted">
          Datum popisek (nepovinné)
        </label>
        <input
          name="dateLabel"
          defaultValue={email?.dateLabel ?? ""}
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
          {pending ? "Ukládám…" : email ? "Uložit změny" : "Přidat e-mail"}
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
