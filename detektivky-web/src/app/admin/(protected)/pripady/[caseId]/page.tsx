import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { togglePublishCase } from "@/app/actions/admin";
import { CaseEditForm } from "./CaseEditForm";
import { PersonsManager } from "./PersonsManager";
import { DocumentsManager } from "./DocumentsManager";
import { WiretapsManager } from "./WiretapsManager";
import { EmailsManager } from "./EmailsManager";

export const metadata: Metadata = {
  title: "Případ — Detektivky.cz administrace",
  robots: { index: false, follow: false },
};

export default async function CaseDetailPage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;

  const record = await prisma.case.findUnique({
    where: { id: caseId },
    include: {
      persons: { orderBy: { sortOrder: "asc" } },
      documents: { orderBy: { sortOrder: "asc" } },
      wiretaps: { orderBy: { sortOrder: "asc" } },
      emails: { orderBy: { sortOrder: "asc" } },
      _count: { select: { boxes: true } },
    },
  });

  if (!record) notFound();

  const personOptions = record.persons.map((p) => ({ id: p.id, name: p.name }));

  return (
    <div className="mx-auto max-w-3xl space-y-10">
      <div>
        <Link href="/admin" className="text-sm text-neutral-500 hover:text-neutral-300">
          ← Zpět na přehled
        </Link>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-amber-500">{record.title}</h1>
            <p className="text-sm text-neutral-500">
              /{record.slug} · {record._count.boxes} krabic ·{" "}
              {record.isPublished ? (
                <span className="text-green-400">publikováno</span>
              ) : (
                <span className="text-neutral-500">koncept</span>
              )}
            </p>
          </div>
          <form action={togglePublishCase.bind(null, record.id)}>
            <button
              type="submit"
              className="rounded border border-neutral-700 px-3 py-1.5 text-sm hover:border-amber-500 hover:text-amber-500"
            >
              {record.isPublished ? "Skrýt případ" : "Publikovat případ"}
            </button>
          </form>
        </div>
      </div>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-amber-500">Základní údaje</h2>
        <CaseEditForm record={record} />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-amber-500">
          Osoby ({record.persons.length})
        </h2>
        <PersonsManager caseId={record.id} persons={record.persons} />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-amber-500">
          Důkazy ({record.documents.length})
        </h2>
        <DocumentsManager caseId={record.id} documents={record.documents} />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-amber-500">
          Odposlechy ({record.wiretaps.length})
        </h2>
        <WiretapsManager caseId={record.id} wiretaps={record.wiretaps} />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-amber-500">
          E-maily ({record.emails.length})
        </h2>
        <EmailsManager caseId={record.id} emails={record.emails} persons={personOptions} />
      </section>
    </div>
  );
}
