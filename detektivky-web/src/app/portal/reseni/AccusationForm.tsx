"use client";

import { useState, useActionState } from "react";
import {
  submitAccusation,
  type AccusationFormState,
} from "@/app/actions/case";

type SuspectOption = { id: string; name: string; occupation: string | null };

export function AccusationForm({ suspects }: { suspects: SuspectOption[] }) {
  const [state, action, pending] = useActionState<
    AccusationFormState,
    FormData
  >(submitAccusation, undefined);
  const [retrying, setRetrying] = useState(false);

  if (state && "result" in state && !retrying) {
    return (
      <div
        className={`rounded-lg border p-6 ${
          state.result.isCorrect
            ? "border-success/40 bg-success-bg"
            : "border-danger/40 bg-danger-bg"
        }`}
      >
        <p className="text-lg font-semibold">
          {state.result.isCorrect
            ? "Správně! Případ jste vyřešili."
            : "Bohužel, to není pachatel."}
        </p>
        {state.result.isCorrect && state.result.culpritName && (
          <p className="mt-2 text-white/85">
            Pachatelem byl/a <strong>{state.result.culpritName}</strong>.
          </p>
        )}
        {!state.result.isCorrect && (
          <>
            <p className="mt-2 text-white/85">
              Vraťte se ke spisu, důkazům a odposlechům a zkuste to znovu.
            </p>
            <button
              type="button"
              onClick={() => setRetrying(true)}
              className="mt-4 rounded border border-line px-4 py-2 text-sm hover:border-accent hover:text-accent"
            >
              Zkusit znovu
            </button>
          </>
        )}
      </div>
    );
  }

  return (
    <form
      action={(formData: FormData) => {
        setRetrying(false);
        return action(formData);
      }}
      className="flex flex-col gap-4"
    >
      <div className="flex flex-col gap-2">
        <span className="text-sm text-ink-muted">Koho obviňujete?</span>
        {suspects.map((s) => (
          <label
            key={s.id}
            className="flex cursor-pointer items-center gap-3 rounded border border-line bg-navy-900/60 px-3 py-2 has-[:checked]:border-accent"
          >
            <input
              type="radio"
              name="suspectedPersonId"
              value={s.id}
              required
              className="accent-accent"
            />
            <span>
              {s.name}
              {s.occupation && (
                <span className="ml-2 text-sm text-ink-faint">
                  {s.occupation}
                </span>
              )}
            </span>
          </label>
        ))}
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="reasoning" className="text-sm text-ink-muted">
          Zdůvodnění (nepovinné)
        </label>
        <textarea
          id="reasoning"
          name="reasoning"
          rows={4}
          className="rounded border border-line bg-navy-900 px-3 py-2 text-white focus:border-accent focus:outline-none"
        />
      </div>
      {state && "error" in state && (
        <p role="alert" className="text-sm text-danger">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-accent px-4 py-2 font-semibold text-navy-950 transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Odesílám obvinění…" : "Obvinit"}
      </button>
    </form>
  );
}
