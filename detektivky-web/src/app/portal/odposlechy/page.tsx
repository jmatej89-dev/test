import type { Metadata } from "next";
import { getAuthorizedBox } from "@/lib/dal";
import { prisma } from "@/lib/db";

export const metadata: Metadata = { title: "Odposlechy — Detektivky.cz" };

export default async function OdposlechyPage() {
  const box = await getAuthorizedBox();
  const wiretaps = await prisma.wiretap.findMany({
    where: { caseId: box.caseId },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h2 className="text-xl font-semibold text-accent">Odposlechy</h2>
      {wiretaps.length === 0 && (
        <p className="text-sm text-ink-faint">
          K tomuto případu zatím nejsou nahrány žádné odposlechy.
        </p>
      )}
      <div className="space-y-4">
        {wiretaps.map((w) => (
          <div
            key={w.id}
            className="rounded-lg border border-line bg-navy-900/60 p-4"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="font-medium">{w.title}</span>
              {w.dateLabel && (
                <span className="text-xs text-ink-faint">{w.dateLabel}</span>
              )}
            </div>
            {w.participants && (
              <p className="mt-1 text-sm text-ink-faint">
                Účastníci: {w.participants}
              </p>
            )}
            <audio controls className="mt-3 w-full" src={w.audioUrl}>
              Váš prohlížeč nepodporuje přehrávání audia.
            </audio>
            {w.transcript && (
              <details className="mt-3">
                <summary className="cursor-pointer text-sm text-accent">
                  Zobrazit přepis
                </summary>
                <p className="mt-2 whitespace-pre-line text-sm text-white/85">
                  {w.transcript}
                </p>
              </details>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
