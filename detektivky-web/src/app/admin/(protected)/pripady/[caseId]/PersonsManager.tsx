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
            className="rounded-lg border border-accent bg-navy-900/60 p-4"
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
            className="flex items-start justify-between gap-3 rounded-lg border border-line bg-navy-900/60 p-4"
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium">{person.name}</span>
                <span className="rounded bg-navy-800 px-2 py-0.5 text-xs text-ink-muted">
                  {ROLE_LABEL[person.role] ?? person.role}
                </span>
                {person.isCulprit && (
                  <span className="rounded bg-danger-bg px-2 py-0.5 text-xs text-danger">
                    pachatel
                  </span>
                )}
              </div>
              {person.occupation && (
                <p className="mt-1 text-sm text-ink-faint">
                  {person.occupation}
                </p>
              )}
              <p className="mt-1 text-sm text-ink-muted">{person.bio}</p>
              {(person.relationship || person.alibi) && (
                <p className="mt-1 text-xs text-ink-faint">
                  {person.relationship && <>Vztah: {person.relationship} </>}
                  {person.alibi && <>· Alibi: {person.alibi}</>}
                </p>
              )}
            </div>
            <div className="flex shrink-0 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setEditingId(person.id)}
                aria-label={`Upravit ${person.name}`}
                className="text-ink-muted hover:text-white"
              >
                Upravit
              </button>
              <form action={deletePerson.bind(null, caseId, person.id)}>
                <button
                  type="submit"
                  aria-label={`Smazat ${person.name}`}
                  className="text-danger hover:text-danger/80"
                >
                  Smazat
                </button>
              </form>
            </div>
          </div>
        ),
      )}

      {adding ? (
        <div className="rounded-lg border border-accent bg-navy-900/60 p-4">
          <PersonForm caseId={caseId} onDone={() => setAdding(false)} />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="rounded border border-dashed border-line px-3 py-2 text-sm text-ink-muted hover:border-accent hover:text-accent"
        >
          + Přidat osobu
        </button>
      )}
    </div>
  );
}
