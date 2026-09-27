import Link from "next/link";
import { allTags, getLead, listCategories, listPublished, topArticles } from "@/lib/articles";
import { GridCard, HeadlineRow, LeadCard, OpinionCard, RankedItem, SectionHead, TickerItem } from "@/components/ArticleCard";
import { NewsletterForm } from "@/components/NewsletterForm";

export default function HomePage() {
  const lead = getLead();
  if (!lead) {
    return (
      <div className="py-24 text-center">
        <h1 className="headline text-3xl">Zatím tu nic není</h1>
        <p className="mt-3 text-ink-2">První článek napíšete v <Link href="/admin" className="underline">redakci</Link>.</p>
      </div>
    );
  }

  const used = new Set<number>([lead.id]);
  const take = (items: { id: number }[]) => items.forEach((a) => used.add(a.id));

  const secondary = listPublished({ limit: 2, excludeIds: [...used] });
  take(secondary);
  const latest = listPublished({ limit: 8 });
  const more = listPublished({ limit: 4, excludeIds: [...used] });
  take(more);
  const moreRows = listPublished({ limit: 4, excludeIds: [...used] });
  take(moreRows);
  const categories = listCategories();
  const opinionsCat = categories.find((c) => c.slug === "komentare" || /koment|n[aá]zor/i.test(c.name));
  const opinions = opinionsCat ? listPublished({ categorySlug: opinionsCat.slug, limit: 3 }) : [];
  const sections = categories
    .filter((c) => c.id !== opinionsCat?.id)
    .map((c) => ({ category: c, items: listPublished({ categorySlug: c.slug, limit: 4 }) }))
    .filter((s) => s.items.length >= 2)
    .slice(0, 3);
  const top = topArticles(6).filter((a) => a.published_at && new Date(a.published_at).getTime() <= Date.now());
  const tags = allTags().slice(0, 12);

  return (
    <div className="pt-8 sm:pt-10">
      {/* Hlavní blok */}
      <section className="grid gap-10 lg:grid-cols-12" aria-label="Hlavní zprávy">
        <div className="lg:col-span-8">
          <LeadCard article={lead} />
          {secondary.length > 0 && (
            <div className="mt-10 pt-8 border-t border-line grid gap-8 sm:grid-cols-2">
              {secondary.map((a) => <GridCard key={a.id} article={a} />)}
            </div>
          )}
        </div>
        <aside className="lg:col-span-4 lg:border-l lg:border-line lg:pl-8">
          <div className="flex items-center justify-between border-t-[3px] border-accent pt-2.5 mb-1">
            <h2 className="section-title">Nejnovější</h2>
            <span className="inline-flex items-center gap-1.5 text-[0.68rem] font-semibold text-accent"><span className="relative flex h-1.5 w-1.5"><span className="absolute inline-flex h-full w-full rounded-full bg-accent opacity-60 animate-ping" /><span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent" /></span>Živě</span>
          </div>
          <ul>{latest.map((a) => <TickerItem key={a.id} article={a} />)}</ul>
          <div className="mt-8 rounded-lg bg-wash p-5">
            <p className="section-title">Newsletter</p>
            <p className="mt-2 text-sm text-ink-2 leading-relaxed">To nejdůležitější z týdne v jednom e-mailu. Žádný spam, odhlášení jedním kliknutím.</p>
            <div className="mt-3"><NewsletterForm compact /></div>
          </div>
        </aside>
      </section>

      {/* Další zprávy */}
      {more.length > 0 && (
        <section className="mt-16">
          <SectionHead title="Další zprávy" />
          <div className="grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
            {more.map((a) => <GridCard key={a.id} article={a} size="sm" />)}
          </div>
          {moreRows.length > 0 && (
            <div className="mt-8 pt-2 border-t border-line grid gap-x-10 md:grid-cols-2">
              {moreRows.map((a) => <HeadlineRow key={a.id} article={a} showCategory />)}
            </div>
          )}
        </section>
      )}

      {/* Komentáře */}
      {opinions.length > 0 && opinionsCat && (
        <section className="mt-16 -mx-4 sm:-mx-6 lg:mx-[calc(50%-50vw)] bg-dark text-white">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12">
            <div className="flex items-baseline justify-between border-t-2 border-white/90 pt-3 mb-8">
              <h2 className="section-title text-white">Názory a komentáře</h2>
              <Link href={`/rubrika/${opinionsCat.slug}`} className="text-xs font-semibold text-white/60 hover:text-white">Všechny →</Link>
            </div>
            <div className="grid gap-10 md:grid-cols-3">
              {opinions.map((a) => <OpinionCard key={a.id} article={a} />)}
            </div>
          </div>
        </section>
      )}

      {/* Z rubrik */}
      {sections.length > 0 && (
        <section className="mt-16">
          <div className="grid gap-12 lg:grid-cols-3">
            {sections.map(({ category, items }) => {
              const [first, ...rest] = items;
              return (
                <div key={category.id}>
                  <SectionHead title={category.name} href={`/rubrika/${category.slug}`} />
                  <GridCard article={first} />
                  <div className="mt-6 pt-2 border-t border-line">
                    {rest.map((a) => <HeadlineRow key={a.id} article={a} />)}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Nejčtenější + témata */}
      {top.length > 0 && (
        <section className="mt-16 grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <SectionHead title="Nejčtenější" />
            <ol className="grid gap-x-10 md:grid-cols-2">
              {top.map((a, i) => <RankedItem key={a.id} article={a} rank={i + 1} />)}
            </ol>
          </div>
          <div className="lg:col-span-4">
            <SectionHead title="Témata" />
            <ul className="flex flex-wrap gap-2">
              {tags.map((t) => (
                <li key={t.id}><Link href={`/tema/${t.slug}`} className="inline-block rounded-full border border-line-strong px-3.5 py-1.5 text-[0.8rem] font-semibold hover:border-ink hover:bg-surface">{t.name}<span className="ml-1.5 text-faint tnum">{t.count}</span></Link></li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </div>
  );
}
