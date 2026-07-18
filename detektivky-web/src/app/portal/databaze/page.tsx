import type { Metadata } from "next";
import { getAuthorizedBox } from "@/lib/dal";
import { prisma } from "@/lib/db";
import { PERSON_PUBLIC_SELECT } from "@/lib/dto";
import { PersonSearch } from "./PersonSearch";

export const metadata: Metadata = { title: "Databáze osob — Detektivky.cz" };

export default async function DatabazePage() {
  const box = await getAuthorizedBox();
  const persons = await prisma.person.findMany({
    where: { caseId: box.caseId },
    select: PERSON_PUBLIC_SELECT,
    orderBy: { sortOrder: "asc" },
  });

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h2 className="text-xl font-semibold text-accent">
        Databáze osob v případu
      </h2>
      <PersonSearch persons={persons} />
    </div>
  );
}
