import type { Metadata } from "next";
import { searchPublished } from "@/lib/articles";
import { RowCard } from "@/components/ArticleCard";

export const metadata: Metadata = { title: "Hledat" };

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const query = q.trim();
  const results = query.length >= 2 ? searchPublished(query) : [];
  return (
    <div className="py-8 max-w-3xl">
      <h1 className="headline text-4xl">Hledat</h1>
      <form action="/hledat" className="mt-5 flex gap-2">
        <input name="q" defaultValue={query} placeholder="Co hledáte?" className="field text-base" autoFocus aria-label="Hledaný výraz" />
        <button className="btn btn-primary" type="submit">Hledat</button>
      </form>
      {query && (
        <p className="meta mt-4">{results.length === 0 ? `Pro „${query}“ jsme nic nenašli.` : `Nalezeno: ${results.length}`}</p>
      )}
      <div className="mt-4">{results.map((a) => <RowCard key={a.id} article={a} showPerex />)}</div>
    </div>
  );
}
