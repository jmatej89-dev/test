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
    <div className="py-8">
      <header className="border-b border-line pb-5 mb-4">
        <p className="kicker">Téma</p>
        <h1 className="headline text-4xl mt-1">{tag.name}</h1>
      </header>
      <div className="grid gap-x-8 md:grid-cols-2">{items.map((a) => <RowCard key={a.id} article={a} showPerex />)}</div>
      {items.length === 0 && <p className="text-muted">K tomuto tématu zatím nic nemáme.</p>}
    </div>
  );
}
