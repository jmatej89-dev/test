import Link from "next/link";
import { getLead, listCategories, listPublished } from "@/lib/articles";
import { getSettings } from "@/lib/settings";
import { GridCard, LeadCard, RowCard, SectionHeading, TickerItem } from "@/components/ArticleCard";

export default function HomePage() {
  const settings = getSettings();
  const lead = getLead();
  const used: number[] = lead ? [lead.id] : [];
  const latest = listPublished({ limit: 8 });
  const secondRow = listPublished({ limit: 3, excludeIds: used });
  used.push(...secondRow.map((a) => a.id));
  const more = listPublished({ limit: 6, excludeIds: used });
  used.push(...more.map((a) => a.id));
  const categories = listCategories().filter((c) => (c.article_count ?? 0) > 0);

  if (!lead) {
    return (
      <div className="py-24 text-center">
        <h1 className="headline text-3xl">Zatím tu nic není</h1>
        <p className="mt-3 text-ink-2">První článek napíšete v <Link href="/admin" className="underline">redakci</Link>.</p>
      </div>
    );
  }

  return (
    <div className="py-8">
      {settings.tagline && <p className="sr-only">{settings.tagline}</p>}

      <div className="grid gap-10 lg:grid-cols-[1fr_300px]">
        <div className="space-y-10">
          <LeadCard article={lead} />

          {secondRow.length > 0 && (
            <section className="border-t border-line pt-6 grid gap-8 sm:grid-cols-3">
              {secondRow.map((a) => <GridCard key={a.id} article={a} />)}
            </section>
          )}
        </div>

        <aside className="lg:border-l lg:border-line lg:pl-6">
          <div className="flex items-center justify-between border-t-2 border-accent pt-2 mb-1">
            <h2 className="text-[0.95rem] font-bold tracking-tight">Nejnovější</h2>
            <span className="inline-flex items-center gap-1.5 text-[0.7rem] font-semibold text-accent"><span className="h-1.5 w-1.5 rounded-full bg-accent" />Aktuálně</span>
          </div>
          <ul>{latest.map((a) => <TickerItem key={a.id} article={a} />)}</ul>
        </aside>
      </div>

      {more.length > 0 && (
        <section className="mt-14">
          <SectionHeading title="Další články" />
          <div className="grid gap-x-8 md:grid-cols-2">
            {more.map((a) => <RowCard key={a.id} article={a} />)}
          </div>
        </section>
      )}

      {categories.map((c) => {
        const items = listPublished({ categorySlug: c.slug, limit: 4 });
        if (items.length < 2) return null;
        return (
          <section key={c.id} className="mt-14">
            <SectionHeading title={c.name} href={`/rubrika/${c.slug}`} count={c.article_count} />
            <div className="grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
              {items.map((a) => <GridCard key={a.id} article={a} />)}
            </div>
          </section>
        );
      })}
    </div>
  );
}
