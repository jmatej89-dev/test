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
            className="rounded-lg border border-accent bg-navy-900/60 p-4"
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
            className="flex items-start justify-between gap-3 rounded-lg border border-line bg-navy-900/60 p-4"
          >
            <div>
              <span className="font-medium">{e.subject}</span>
              <p className="mt-1 text-sm text-ink-faint">
                {nameOf(e.fromPersonId)} → {nameOf(e.toPersonId)}
                {e.dateLabel ? ` · ${e.dateLabel}` : ""}
              </p>
              <p className="mt-1 line-clamp-2 text-sm text-ink-muted">{e.body}</p>
            </div>
            <div className="flex shrink-0 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setEditingId(e.id)}
                aria-label={`Upravit ${e.subject}`}
                className="text-ink-muted hover:text-white"
              >
                Upravit
              </button>
              <form action={deleteEmail.bind(null, caseId, e.id)}>
                <button
                  type="submit"
                  aria-label={`Smazat ${e.subject}`}
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
          <EmailForm caseId={caseId} persons={persons} onDone={() => setAdding(false)} />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="rounded border border-dashed border-line px-3 py-2 text-sm text-ink-muted hover:border-accent hover:text-accent"
        >
          + Přidat e-mail
        </button>
      )}
    </div>
  );
}
