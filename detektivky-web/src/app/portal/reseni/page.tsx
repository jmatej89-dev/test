import type { Metadata } from "next";
import { getAuthorizedBox } from "@/lib/dal";
import { prisma } from "@/lib/db";
import { AccusationForm } from "./AccusationForm";

export const metadata: Metadata = { title: "Řešení případu — Detektivky.cz" };

export default async function ReseniPage() {
  const box = await getAuthorizedBox();

  const [suspects, history] = await Promise.all([
    prisma.person.findMany({
      where: { caseId: box.caseId, role: "SUSPECT" },
      select: { id: true, name: true, occupation: true },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.accusation.findMany({
      where: { boxId: box.id },
      include: { suspectedPerson: { select: { name: true } } },
      orderBy: { submittedAt: "desc" },
    }),
  ]);

  const alreadySolved = history.some((h) => h.isCorrect);

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-amber-500">
          Kdo je pachatel?
        </h2>
        <p className="mt-1 text-sm text-neutral-400">
          Až budete mít jasno, vyberte podezřelého a odešlete své obvinění.
          Počet pokusů není omezen.
        </p>
      </div>

      {alreadySolved ? (
        <div className="rounded-lg border border-green-800 bg-green-950/40 p-6">
          <p className="text-lg font-semibold">
            Případ je již vyřešen — gratulujeme!
          </p>
        </div>
      ) : (
        <AccusationForm suspects={suspects} />
      )}

      {history.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-semibold text-neutral-400">
            Historie pokusů
          </h3>
          <ul className="space-y-1 text-sm">
            {history.map((h) => (
              <li
                key={h.id}
                className={h.isCorrect ? "text-green-400" : "text-neutral-500"}
              >
                {new Date(h.submittedAt).toLocaleString("cs-CZ")} —{" "}
                {h.suspectedPerson.name} —{" "}
                {h.isCorrect ? "správně" : "nesprávně"}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
