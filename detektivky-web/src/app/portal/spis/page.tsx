import type { Metadata } from "next";
import { getAuthorizedBox } from "@/lib/dal";
import { prisma } from "@/lib/db";
import { PERSON_PUBLIC_SELECT } from "@/lib/dto";

export const metadata: Metadata = { title: "Spis případu — Detektivky.cz" };

const ROLE_LABEL: Record<string, string> = {
  VICTIM: "Oběť",
  SUSPECT: "Podezřelý",
  WITNESS: "Svědek",
  OTHER: "Osoba",
};

export default async function SpisPage() {
  const box = await getAuthorizedBox();
  const persons = await prisma.person.findMany({
    where: { caseId: box.caseId },
    select: PERSON_PUBLIC_SELECT,
    orderBy: { sortOrder: "asc" },
  });

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <section>
        <h2 className="mb-2 text-xl font-semibold text-accent">
          {box.case.title}
        </h2>
        {box.case.subtitle && (
          <p className="mb-4 text-ink-muted italic">{box.case.subtitle}</p>
        )}
        <p className="whitespace-pre-line text-white">
          {box.case.description}
        </p>
      </section>

      <section>
        <h3 className="mb-3 text-lg font-semibold">Osoby v případu</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {persons.map((person) => (
            <div
              key={person.id}
              className="rounded-lg border border-line bg-navy-900/60 p-4"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{person.name}</span>
                <span className="rounded bg-navy-800 px-2 py-0.5 text-xs text-ink-muted">
                  {ROLE_LABEL[person.role] ?? person.role}
                </span>
              </div>
              {person.occupation && (
                <p className="mt-1 text-sm text-ink-faint">
                  {person.occupation}
                </p>
              )}
              <p className="mt-2 text-sm text-white/85">{person.bio}</p>
            </div>
          ))}
          {persons.length === 0 && (
            <p className="text-sm text-ink-faint">
              Osoby v tomto případu zatím nejsou zveřejněny.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
