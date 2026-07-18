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
import { TimelineManager } from "./TimelineManager";

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
      timelineEvents: { orderBy: { sortOrder: "asc" } },
      _count: { select: { boxes: true } },
    },
  });

  if (!record) notFound();

  const personOptions = record.persons.map((p) => ({ id: p.id, name: p.name }));

  return (
    <div className="mx-auto max-w-3xl space-y-10">
      <div>
        <Link href="/admin" className="text-sm text-ink-faint hover:text-white">
          ← Zpět na přehled
        </Link>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-accent">{record.title}</h1>
            <p className="text-sm text-ink-faint">
              /{record.slug} · {record._count.boxes} krabic ·{" "}
              {record.isPublished ? (
                <span className="text-success">publikováno</span>
              ) : (
                <span className="text-ink-faint">koncept</span>
              )}
            </p>
          </div>
          <form action={togglePublishCase.bind(null, record.id)}>
            <button
              type="submit"
              className="rounded border border-line px-3 py-1.5 text-sm hover:border-accent hover:text-accent"
            >
              {record.isPublished ? "Skrýt případ" : "Publikovat případ"}
            </button>
          </form>
        </div>
      </div>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-accent">Základní údaje</h2>
        <CaseEditForm record={record} />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-accent">
          Osoby ({record.persons.length})
        </h2>
        <PersonsManager caseId={record.id} persons={record.persons} />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-accent">
          Důkazy ({record.documents.length})
        </h2>
        <DocumentsManager caseId={record.id} documents={record.documents} />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-accent">
          Odposlechy ({record.wiretaps.length})
        </h2>
        <WiretapsManager caseId={record.id} wiretaps={record.wiretaps} />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-accent">
          E-maily ({record.emails.length})
        </h2>
        <EmailsManager caseId={record.id} emails={record.emails} persons={personOptions} />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-accent">
          Časová osa ({record.timelineEvents.length})
        </h2>
        <TimelineManager caseId={record.id} events={record.timelineEvents} />
      </section>
    </div>
  );
}
