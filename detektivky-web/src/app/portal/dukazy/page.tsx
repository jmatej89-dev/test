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
      <h2 className="text-xl font-semibold text-amber-500">Důkazy</h2>
      {documents.length === 0 && (
        <p className="text-sm text-neutral-500">
          K tomuto případu zatím nejsou nahrány žádné důkazy.
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        {documents.map((doc) => (
          <div
            key={doc.id}
            className="overflow-hidden rounded-lg border border-neutral-800 bg-neutral-900/50"
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
                <span className="rounded bg-neutral-800 px-2 py-0.5 text-xs text-neutral-400">
                  {TYPE_LABEL[doc.type] ?? doc.type}
                </span>
              </div>
              {doc.description && (
                <p className="mt-2 text-sm text-neutral-400">
                  {doc.description}
                </p>
              )}
              {doc.type === "NOTE" && doc.content && (
                <p className="mt-2 whitespace-pre-line font-mono text-sm text-neutral-300">
                  {doc.content}
                </p>
              )}
              {doc.type === "PDF" && doc.url && (
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-block text-sm text-amber-500 hover:underline"
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
