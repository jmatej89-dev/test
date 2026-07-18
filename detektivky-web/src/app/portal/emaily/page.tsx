import type { Metadata } from "next";
import { getAuthorizedBox } from "@/lib/dal";
import { prisma } from "@/lib/db";

export const metadata: Metadata = { title: "E-maily — Detektivky.cz" };

export default async function EmailyPage() {
  const box = await getAuthorizedBox();
  const emails = await prisma.email.findMany({
    where: { caseId: box.caseId },
    include: { fromPerson: true, toPerson: true },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h2 className="text-xl font-semibold text-accent">
        Zachycená e-mailová komunikace
      </h2>
      {emails.length === 0 && (
        <p className="text-sm text-ink-faint">
          K tomuto případu zatím nejsou nahrány žádné e-maily.
        </p>
      )}
      <div className="space-y-3">
        {emails.map((email) => (
          <details
            key={email.id}
            className="rounded-lg border border-line bg-navy-900/60"
          >
            <summary className="cursor-pointer px-4 py-3">
              <span className="font-medium">{email.subject}</span>
              <span className="ml-2 text-xs text-ink-faint">
                {email.fromPerson?.name ?? "Neznámý odesílatel"} →{" "}
                {email.toPerson?.name ?? "Neznámý příjemce"}
                {email.dateLabel ? ` · ${email.dateLabel}` : ""}
              </span>
            </summary>
            <div className="border-t border-line px-4 py-3">
              <p className="whitespace-pre-line text-sm text-white/85">
                {email.body}
              </p>
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}
