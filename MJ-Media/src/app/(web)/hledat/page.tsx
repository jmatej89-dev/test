import type { Metadata } from "next";
import { searchPublished } from "@/lib/articles";
import { RowCard } from "@/components/ArticleCard";

export const metadata: Metadata = { title: "Hledat" };

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const query = q.trim();
  const results = query.length >= 2 ? searchPublished(query) : [];
  return (
    <div className="pt-8 sm:pt-12 max-w-3xl">
      <p className="kicker">Vyhledávání</p>
      <h1 className="headline text-[2.6rem] sm:text-[3.2rem] mt-2">Hledat</h1>
      <form action="/hledat" className="mt-6 flex gap-2">
        <input name="q" defaultValue={query} placeholder="Co hledáte?" className="field text-base py-3" autoFocus aria-label="Hledaný výraz" />
        <button className="btn btn-primary" type="submit">Hledat</button>
      </form>
      {query && (
        <p className="meta mt-5">{results.length === 0 ? `Pro „${query}“ jsme nic nenašli.` : `Nalezeno: ${results.length}`}</p>
      )}
      <div className="mt-4 border-t border-line">{results.map((a) => <RowCard key={a.id} article={a} />)}</div>
    </div>
  );
}
