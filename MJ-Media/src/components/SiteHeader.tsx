import Link from "next/link";
import { Logo } from "./Logo";
import type { Category } from "@/lib/articles";
import { formatDate } from "@/lib/format";

const DAYS = ["neděle", "pondělí", "úterý", "středa", "čtvrtek", "pátek", "sobota"];

export function SiteHeader({ categories, siteName }: { categories: Category[]; siteName: string }) {
  const today = new Date();
  return (
    <header className="bg-paper">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex items-center justify-between py-2 text-[0.72rem] text-muted border-b border-line">
          <span className="capitalize">{DAYS[today.getDay()]} {formatDate(today.toISOString())}</span>
          <div className="flex items-center gap-4">
            <Link href="/rss.xml" className="hover:text-ink">RSS</Link>
            <Link href="/o-nas" className="hover:text-ink">O nás</Link>
            <Link href="/admin" className="hover:text-ink">Redakce</Link>
          </div>
        </div>
        <div className="flex items-center justify-between py-5 sm:py-6">
          <Link href="/" aria-label={siteName} className="link-quiet">
            <Logo size={40} />
          </Link>
          <form action="/hledat" className="hidden sm:flex items-center border border-line-strong rounded-full pl-3 pr-1 py-1 bg-surface focus-within:border-ink">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
            <input name="q" placeholder="Hledat" className="bg-transparent outline-none text-sm px-2 w-36" aria-label="Hledat" />
            <button className="btn btn-primary btn-sm rounded-full" type="submit">Hledat</button>
          </form>
        </div>
        <nav aria-label="Rubriky" className="border-t-2 border-ink border-b border-line">
          <ul className="flex gap-1 overflow-x-auto -mx-2 px-2 py-1 text-[0.85rem] font-semibold whitespace-nowrap">
            <li><Link href="/" className="inline-block px-2 py-1.5 hover:text-accent">Domů</Link></li>
            {categories.map((c) => (
              <li key={c.id}><Link href={`/rubrika/${c.slug}`} className="inline-block px-2 py-1.5 hover:text-accent">{c.name}</Link></li>
            ))}
            <li className="sm:hidden ml-auto"><Link href="/hledat" className="inline-block px-2 py-1.5 hover:text-accent">Hledat</Link></li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
