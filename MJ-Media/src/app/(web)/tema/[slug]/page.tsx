import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTagBySlug, listPublished } from "@/lib/articles";
import { RowCard } from "@/components/ArticleCard";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const t = getTagBySlug(slug);
  return t ? { title: `Téma: ${t.name}` } : {};
}

export default async function TagPage({ params }: Props) {
  const { slug } = await params;
  const tag = getTagBySlug(slug);
  if (!tag) notFound();
  const items = listPublished({ tagSlug: slug, limit: 50 });
  return (
    <div className="pt-8 sm:pt-12">
      <header className="mb-8">
        <p className="kicker">Téma</p>
        <h1 className="headline text-[2.6rem] sm:text-[3.2rem] mt-2">{tag.name}</h1>
        <p className="meta mt-3">{items.length} {items.length === 1 ? "článek" : items.length < 5 ? "články" : "článků"}</p>
      </header>
      <div className="border-t-2 border-ink pt-2 grid gap-x-10 md:grid-cols-2">{items.map((a) => <RowCard key={a.id} article={a} />)}</div>
      {items.length === 0 && <p className="text-muted py-10">K tomuto tématu zatím nic nemáme.</p>}
    </div>
  );
}
