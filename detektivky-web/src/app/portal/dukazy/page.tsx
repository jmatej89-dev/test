import type { Metadata } from "next";
import { getAuthorizedBox } from "@/lib/dal";
import { prisma } from "@/lib/db";

export const metadata: Metadata = { title: "Důkazy — Detektivky.cz" };

const TYPE_LABEL: Record<string, string> = {
  PHOTO: "Fotografie",
  PDF: "Dokument",
  NOTE: "Poznámka",
};

export default async function DukazyPage() {
  const box = await getAuthorizedBox();
  const documents = await prisma.document.findMany({
    where: { caseId: box.caseId },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h2 className="text-xl font-semibold text-accent">Důkazy</h2>
      {documents.length === 0 && (
        <p className="text-sm text-ink-faint">
          K tomuto případu zatím nejsou nahrány žádné důkazy.
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        {documents.map((doc) => (
          <div
            key={doc.id}
            className="overflow-hidden rounded-lg border border-line bg-navy-900/60"
          >
            {doc.type === "PHOTO" && doc.url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={doc.url}
                alt={doc.title}
                className="h-48 w-full object-cover"
              />
            )}
            <div className="p-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">{doc.title}</span>
                <span className="rounded bg-navy-800 px-2 py-0.5 text-xs text-ink-muted">
                  {TYPE_LABEL[doc.type] ?? doc.type}
                </span>
              </div>
              {doc.description && (
                <p className="mt-2 text-sm text-ink-muted">
                  {doc.description}
                </p>
              )}
              {doc.type === "NOTE" && doc.content && (
                <p className="mt-2 whitespace-pre-line font-mono text-sm text-white/85">
                  {doc.content}
                </p>
              )}
              {doc.type === "PDF" && doc.url && (
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-block text-sm text-accent hover:underline"
                >
                  Otevřít dokument →
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
