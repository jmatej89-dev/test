"use client";

import { useState } from "react";
import { deleteEmail } from "@/app/actions/admin-content";
import { EmailForm, type EmailRecord } from "./EmailForm";

type PersonOption = { id: string; name: string };

export function EmailsManager({
  caseId,
  emails,
  persons,
}: {
  caseId: string;
  emails: EmailRecord[];
  persons: PersonOption[];
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const nameOf = (id: string | null) =>
    persons.find((p) => p.id === id)?.name ?? "neznámý";

  return (
    <div className="space-y-3">
      {emails.map((e) =>
        editingId === e.id ? (
          <div
            key={e.id}
            className="rounded-lg border border-amber-800 bg-neutral-900/50 p-4"
          >
            <EmailForm
              caseId={caseId}
              email={e}
              persons={persons}
              onDone={() => setEditingId(null)}
            />
          </div>
        ) : (
          <div
            key={e.id}
            className="flex items-start justify-between gap-3 rounded-lg border border-neutral-800 bg-neutral-900/50 p-4"
          >
            <div>
              <span className="font-medium">{e.subject}</span>
              <p className="mt-1 text-sm text-neutral-500">
                {nameOf(e.fromPersonId)} → {nameOf(e.toPersonId)}
                {e.dateLabel ? ` · ${e.dateLabel}` : ""}
              </p>
              <p className="mt-1 line-clamp-2 text-sm text-neutral-400">{e.body}</p>
            </div>
            <div className="flex shrink-0 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setEditingId(e.id)}
                aria-label={`Upravit ${e.subject}`}
                className="text-neutral-400 hover:text-neutral-100"
              >
                Upravit
              </button>
              <form action={deleteEmail.bind(null, caseId, e.id)}>
                <button
                  type="submit"
                  aria-label={`Smazat ${e.subject}`}
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
          <EmailForm caseId={caseId} persons={persons} onDone={() => setAdding(false)} />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="rounded border border-dashed border-neutral-700 px-3 py-2 text-sm text-neutral-400 hover:border-amber-500 hover:text-amber-500"
        >
          + Přidat e-mail
        </button>
      )}
    </div>
  );
}
