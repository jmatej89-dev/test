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
            ? "border-green-800 bg-green-950/40"
            : "border-red-800 bg-red-950/40"
        }`}
      >
        <p className="text-lg font-semibold">
          {state.result.isCorrect
            ? "Správně! Případ jste vyřešili."
            : "Bohužel, to není pachatel."}
        </p>
        {state.result.isCorrect && state.result.culpritName && (
          <p className="mt-2 text-neutral-300">
            Pachatelem byl/a <strong>{state.result.culpritName}</strong>.
          </p>
        )}
        {!state.result.isCorrect && (
          <>
            <p className="mt-2 text-neutral-300">
              Vraťte se ke spisu, důkazům a odposlechům a zkuste to znovu.
            </p>
            <button
              type="button"
              onClick={() => setRetrying(true)}
              className="mt-4 rounded border border-neutral-700 px-4 py-2 text-sm hover:border-amber-500 hover:text-amber-500"
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
        <span className="text-sm text-neutral-400">Koho obviňujete?</span>
        {suspects.map((s) => (
          <label
            key={s.id}
            className="flex cursor-pointer items-center gap-3 rounded border border-neutral-800 bg-neutral-900/50 px-3 py-2 has-[:checked]:border-amber-500"
          >
            <input
              type="radio"
              name="suspectedPersonId"
              value={s.id}
              required
              className="accent-amber-600"
            />
            <span>
              {s.name}
              {s.occupation && (
                <span className="ml-2 text-sm text-neutral-500">
                  {s.occupation}
                </span>
              )}
            </span>
          </label>
        ))}
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="reasoning" className="text-sm text-neutral-400">
          Zdůvodnění (nepovinné)
        </label>
        <textarea
          id="reasoning"
          name="reasoning"
          rows={4}
          className="rounded border border-neutral-700 bg-neutral-900 px-3 py-2 text-neutral-100 focus:border-amber-500 focus:outline-none"
        />
      </div>
      {state && "error" in state && (
        <p role="alert" className="text-sm text-red-400">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-amber-600 px-4 py-2 font-semibold text-neutral-950 transition hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Odesílám obvinění…" : "Obvinit"}
      </button>
    </form>
  );
}
