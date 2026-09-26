import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { countPublished, getCategoryBySlug, listPublished } from "@/lib/articles";
import { GridCard, RowCard } from "@/components/ArticleCard";

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
  const [first, second, third, ...rest] = page === 1 ? items : [];
  const list = page === 1 ? rest : items;

  return (
    <div className="py-8">
      <header className="border-b border-line pb-5 mb-8">
        <h1 className="headline text-4xl">{category.name}</h1>
        {category.description && <p className="mt-2 text-ink-2">{category.description}</p>}
        <p className="meta mt-2">{total} {total === 1 ? "článek" : total < 5 ? "články" : "článků"}</p>
      </header>
      {total === 0 && <p className="text-muted">V této rubrice zatím nic není.</p>}
      {page === 1 && first && (
        <div className="grid gap-8 md:grid-cols-3 mb-10">
          {[first, second, third].filter(Boolean).map((a) => <GridCard key={a!.id} article={a!} big />)}
        </div>
      )}
      <div className="grid gap-x-8 md:grid-cols-2">{list.map((a) => <RowCard key={a.id} article={a} />)}</div>
      {pages > 1 && (
        <nav className="mt-10 flex items-center justify-center gap-2 text-sm" aria-label="Stránkování">
          {page > 1 && <Link className="btn btn-ghost btn-sm" href={`/rubrika/${slug}?strana=${page - 1}`}>← Novější</Link>}
          <span className="text-muted px-2">Strana {page} z {pages}</span>
          {page < pages && <Link className="btn btn-ghost btn-sm" href={`/rubrika/${slug}?strana=${page + 1}`}>Starší →</Link>}
        </nav>
      )}
    </div>
  );
}
