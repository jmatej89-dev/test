import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { countPublished, getCategoryBySlug, listPublished } from "@/lib/articles";
import { GridCard, LeadCard, RowCard } from "@/components/ArticleCard";

const PAGE = 12;
type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ strana?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const c = getCategoryBySlug(slug);
  return c ? { title: c.name, description: c.description } : {};
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { strana } = await searchParams;
  const category = getCategoryBySlug(slug);
  if (!category) notFound();
  const page = Math.max(1, Number(strana) || 1);
  const total = countPublished({ categorySlug: slug });
  const pages = Math.max(1, Math.ceil(total / PAGE));
  const items = listPublished({ categorySlug: slug, limit: PAGE, offset: (page - 1) * PAGE });
  const lead = page === 1 ? items[0] : undefined;
  const grid = page === 1 ? items.slice(1, 4) : [];
  const rest = page === 1 ? items.slice(4) : items;

  return (
    <div className="pt-8 sm:pt-12">
      <header className="mb-10">
        <p className="kicker">Rubrika</p>
        <h1 className="headline text-[2.6rem] sm:text-[3.2rem] mt-2">{category.name}</h1>
        {category.description && <p className="dek mt-3 text-lg text-ink-2 max-w-2xl">{category.description}</p>}
        <p className="meta mt-3">{total} {total === 1 ? "článek" : total < 5 ? "články" : "článků"}</p>
      </header>
      {total === 0 && <p className="text-muted py-10">V této rubrice zatím nic není.</p>}
      {lead && (
        <section className="grid gap-10 lg:grid-cols-12 border-t-2 border-ink pt-8">
          <div className="lg:col-span-8"><LeadCard article={lead} /></div>
          <div className="lg:col-span-4 lg:border-l lg:border-line lg:pl-8 flex flex-col gap-7">
            {grid.map((a) => <GridCard key={a.id} article={a} size="sm" />)}
          </div>
        </section>
      )}
      {rest.length > 0 && (
        <section className="mt-12 border-t-2 border-ink pt-2 grid gap-x-10 md:grid-cols-2">
          {rest.map((a) => <RowCard key={a.id} article={a} />)}
        </section>
      )}
      {pages > 1 && (
        <nav className="mt-12 flex items-center justify-center gap-3 text-sm" aria-label="Stránkování">
          {page > 1 && <Link className="btn btn-ghost btn-sm" href={`/rubrika/${slug}?strana=${page - 1}`}>← Novější</Link>}
          <span className="text-muted">Strana {page} z {pages}</span>
          {page < pages && <Link className="btn btn-ghost btn-sm" href={`/rubrika/${slug}?strana=${page + 1}`}>Starší →</Link>}
        </nav>
      )}
    </div>
  );
}
