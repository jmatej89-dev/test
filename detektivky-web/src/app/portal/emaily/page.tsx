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
      <h2 className="text-xl font-semibold text-amber-500">
        Zachycená e-mailová komunikace
      </h2>
      {emails.length === 0 && (
        <p className="text-sm text-neutral-500">
          K tomuto případu zatím nejsou nahrány žádné e-maily.
        </p>
      )}
      <div className="space-y-3">
        {emails.map((email) => (
          <details
            key={email.id}
            className="rounded-lg border border-neutral-800 bg-neutral-900/50"
          >
            <summary className="cursor-pointer px-4 py-3">
              <span className="font-medium">{email.subject}</span>
              <span className="ml-2 text-xs text-neutral-500">
                {email.fromPerson?.name ?? "Neznámý odesílatel"} →{" "}
                {email.toPerson?.name ?? "Neznámý příjemce"}
                {email.dateLabel ? ` · ${email.dateLabel}` : ""}
              </span>
            </summary>
            <div className="border-t border-neutral-800 px-4 py-3">
              <p className="whitespace-pre-line text-sm text-neutral-300">
                {email.body}
              </p>
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}
