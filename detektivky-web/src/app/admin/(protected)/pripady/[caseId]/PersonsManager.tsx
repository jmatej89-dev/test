"use client";

import { useState } from "react";
import { deletePerson } from "@/app/actions/admin-content";
import { PersonForm, type PersonRecord } from "./PersonForm";

const ROLE_LABEL: Record<string, string> = {
  VICTIM: "Oběť",
  SUSPECT: "Podezřelý",
  WITNESS: "Svědek",
  OTHER: "Osoba",
};

export function PersonsManager({
  caseId,
  persons,
}: {
  caseId: string;
  persons: PersonRecord[];
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  return (
    <div className="space-y-3">
      {persons.map((person) =>
        editingId === person.id ? (
          <div
            key={person.id}
            className="rounded-lg border border-amber-800 bg-neutral-900/50 p-4"
          >
            <PersonForm
              caseId={caseId}
              person={person}
              onDone={() => setEditingId(null)}
            />
          </div>
        ) : (
          <div
            key={person.id}
            className="flex items-start justify-between gap-3 rounded-lg border border-neutral-800 bg-neutral-900/50 p-4"
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium">{person.name}</span>
                <span className="rounded bg-neutral-800 px-2 py-0.5 text-xs text-neutral-400">
                  {ROLE_LABEL[person.role] ?? person.role}
                </span>
                {person.isCulprit && (
                  <span className="rounded bg-red-900 px-2 py-0.5 text-xs text-red-300">
                    pachatel
                  </span>
                )}
              </div>
              {person.occupation && (
                <p className="mt-1 text-sm text-neutral-500">
                  {person.occupation}
                </p>
              )}
              <p className="mt-1 text-sm text-neutral-400">{person.bio}</p>
            </div>
            <div className="flex shrink-0 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setEditingId(person.id)}
                aria-label={`Upravit ${person.name}`}
                className="text-neutral-400 hover:text-neutral-100"
              >
                Upravit
              </button>
              <form action={deletePerson.bind(null, caseId, person.id)}>
                <button
                  type="submit"
                  aria-label={`Smazat ${person.name}`}
                  className="text-red-400 hover:text-red-300"
                >
                  Smazat
                </button>
              </form>
            </div>
          </div>
        ),
      )}

      {adding ? (
        <div className="rounded-lg border border-amber-800 bg-neutral-900/50 p-4">
          <PersonForm caseId={caseId} onDone={() => setAdding(false)} />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="rounded border border-dashed border-neutral-700 px-3 py-2 text-sm text-neutral-400 hover:border-amber-500 hover:text-amber-500"
        >
          + Přidat osobu
        </button>
      )}
    </div>
  );
}
