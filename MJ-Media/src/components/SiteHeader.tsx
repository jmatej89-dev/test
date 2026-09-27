import Link from "next/link";
import { Logo, LogoMark } from "./Logo";
import { MobileMenu } from "./MobileMenu";
import type { Category } from "@/lib/articles";
import { formatDate } from "@/lib/format";

const DAYS = ["Neděle", "Pondělí", "Úterý", "Středa", "Čtvrtek", "Pátek", "Sobota"];

export function SiteHeader({ categories, siteName, tagline, activeSlug }: { categories: Category[]; siteName: string; tagline?: string; activeSlug?: string }) {
  const today = new Date();
  return (
    <header>
      <div className="h-1 bg-accent" aria-hidden="true" />
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="hidden sm:flex items-center justify-between h-9 text-[0.72rem] text-muted border-b border-line">
          <span>{DAYS[today.getDay()]} {formatDate(today.toISOString())}</span>
          {tagline && <span className="font-serif italic text-ink-2">{tagline}</span>}
          <div className="flex items-center gap-4">
            <Link href="/o-nas" className="hover:text-ink">O nás</Link>
            <Link href="/rss.xml" className="hover:text-ink">RSS</Link>
            <Link href="/admin" className="hover:text-ink">Redakce</Link>
          </div>
        </div>
        <div className="flex items-center justify-between py-4 sm:py-6">
          <div className="flex items-center gap-2">
            <MobileMenu categories={categories} />
            <Link href="/" aria-label={siteName} className="link-quiet"><Logo size={44} /></Link>
          </div>
          <div className="flex items-center gap-2">
            <form action="/hledat" role="search" className="hidden md:flex items-center h-10 border border-line-strong rounded-full pl-3.5 pr-1.5 bg-surface focus-within:border-ink transition-colors">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
              <input name="q" placeholder="Hledat" className="bg-transparent outline-none text-sm px-2 w-40" aria-label="Hledat" />
            </form>
            <Link href="/newsletter" className="btn btn-outline-accent rounded-full">Odebírat</Link>
          </div>
        </div>
      </div>
      <nav aria-label="Rubriky" className="sticky top-0 z-40 bg-paper/95 backdrop-blur border-t-2 border-ink border-b border-line">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 flex items-center gap-2">
          <Link href="/" className="hidden sm:inline-flex items-center pr-2 text-accent" aria-label="Domů"><LogoMark size={22} /></Link>
          <ul className="flex flex-1 overflow-x-auto -mx-1 px-1 [scrollbar-width:none]">
            <li><Link href="/" className="nav-link" aria-current={!activeSlug ? undefined : undefined}>Domů</Link></li>
            {categories.map((c) => (
              <li key={c.id}><Link href={`/rubrika/${c.slug}`} className="nav-link" aria-current={activeSlug === c.slug ? "page" : undefined}>{c.name}</Link></li>
            ))}
          </ul>
          <Link href="/hledat" className="md:hidden inline-flex items-center justify-center h-9 w-9 rounded-md hover:bg-wash" aria-label="Hledat">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
          </Link>
        </div>
      </nav>
    </header>
  );
}
