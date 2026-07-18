"use client";

import { useState } from "react";
import { deleteDocument } from "@/app/actions/admin-content";
import { DocumentForm, type DocumentRecord } from "./DocumentForm";

export function DocumentsManager({
  caseId,
  documents,
}: {
  caseId: string;
  documents: DocumentRecord[];
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  return (
    <div className="space-y-3">
      {documents.map((doc) =>
        editingId === doc.id ? (
          <div
            key={doc.id}
            className="rounded-lg border border-amber-800 bg-neutral-900/50 p-4"
          >
            <DocumentForm
              caseId={caseId}
              document={doc}
              onDone={() => setEditingId(null)}
            />
          </div>
        ) : (
          <div
            key={doc.id}
            className="flex items-start justify-between gap-3 rounded-lg border border-neutral-800 bg-neutral-900/50 p-4"
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium">{doc.title}</span>
                <span className="rounded bg-neutral-800 px-2 py-0.5 text-xs text-neutral-400">
                  {doc.type}
                </span>
              </div>
              {doc.description && (
                <p className="mt-1 text-sm text-neutral-500">{doc.description}</p>
              )}
              {doc.content && (
                <p className="mt-1 line-clamp-2 text-sm text-neutral-400">
                  {doc.content}
                </p>
              )}
            </div>
            <div className="flex shrink-0 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setEditingId(doc.id)}
                aria-label={`Upravit ${doc.title}`}
                className="text-neutral-400 hover:text-neutral-100"
              >
                Upravit
              </button>
              <form action={deleteDocument.bind(null, caseId, doc.id)}>
                <button
                  type="submit"
                  aria-label={`Smazat ${doc.title}`}
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
          <DocumentForm caseId={caseId} onDone={() => setAdding(false)} />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="rounded border border-dashed border-neutral-700 px-3 py-2 text-sm text-neutral-400 hover:border-amber-500 hover:text-amber-500"
        >
          + Přidat důkaz
        </button>
      )}
    </div>
  );
}
