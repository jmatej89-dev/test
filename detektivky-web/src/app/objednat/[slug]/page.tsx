import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatCzk } from "@/lib/format";
import { OrderInquiryForm } from "./OrderInquiryForm";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const record = await prisma.case.findUnique({ where: { slug } });
  return { title: `${record?.title ?? "Případ"} — Detektivky.cz` };
}

export default async function ObjednatPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const record = await prisma.case.findUnique({ where: { slug } });

  if (!record || !record.isPublished) notFound();

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between px-6 py-5">
        <Link
          href="/"
          className="font-mono text-sm tracking-widest text-accent uppercase"
        >
          Detektivky.cz
        </Link>
        <Link
          href="/prihlaseni"
          className="rounded border border-line px-4 py-1.5 text-sm text-white hover:border-accent hover:text-accent"
        >
          Mám krabici — přihlásit se
        </Link>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
        <Link href="/#pripady" className="text-sm text-ink-faint hover:text-white">
          ← Zpět na nabídku případů
        </Link>

        <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">{record.title}</h1>
            {record.subtitle && (
              <p className="mt-1 text-ink-muted italic">{record.subtitle}</p>
            )}
          </div>
          {record.priceCzk != null && (
            <span className="rounded bg-accent px-3 py-1.5 font-mono text-lg font-bold text-navy-950">
              {formatCzk(record.priceCzk)}
            </span>
          )}
        </div>

        <p className="mt-6 whitespace-pre-line text-white/85">
          {record.description}
        </p>

        <div className="mt-10 rounded-lg border border-line bg-navy-900/60 p-6">
          <h2 className="mb-4 text-lg font-semibold text-accent">
            Máte zájem o tento případ?
          </h2>
          <OrderInquiryForm caseId={record.id} />
        </div>
      </main>
    </div>
  );
}
