import type { Metadata } from "next";
import { getAuthorizedBox } from "@/lib/dal";
import { prisma } from "@/lib/db";

export const metadata: Metadata = { title: "Časová osa — Detektivky.cz" };

export default async function CasovaOsaPage() {
  const box = await getAuthorizedBox();
  const events = await prisma.timelineEvent.findMany({
    where: { caseId: box.caseId },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h2 className="text-xl font-semibold text-accent">Časová osa případu</h2>
      <p className="text-sm text-ink-muted">
        Porovnejte časy, místa a alibi jednotlivých osob — nesrovnalosti
        mohou být klíčem k řešení.
      </p>
      {events.length === 0 && (
        <p className="text-sm text-ink-faint">
          K tomuto případu zatím není nahraná časová osa.
        </p>
      )}
      <ol className="relative space-y-6 border-l border-line pl-6">
        {events.map((event) => (
          <li key={event.id} className="relative">
            <span className="absolute top-1.5 -left-[29px] h-2.5 w-2.5 rounded-full bg-accent" />
            <div className="flex flex-wrap items-baseline gap-2">
              <span className="font-mono text-sm text-accent">
                {event.timeLabel}
              </span>
              <span className="font-medium">{event.title}</span>
            </div>
            {event.locationLabel && (
              <p className="mt-1 text-sm text-ink-faint">
                {event.locationLabel}
              </p>
            )}
            {event.involvedLabel && (
              <p className="mt-1 text-sm text-ink-faint">
                Zúčastnění: {event.involvedLabel}
              </p>
            )}
            {event.description && (
              <p className="mt-1 text-sm text-white/85">
                {event.description}
              </p>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
