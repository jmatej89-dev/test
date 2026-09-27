"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Category } from "@/lib/articles";

export function MobileMenu({ categories }: { categories: Category[] }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);
  return (
    <>
      <button type="button" aria-label="Menu" aria-expanded={open} onClick={() => setOpen(true)} className="md:hidden inline-flex items-center justify-center h-9 w-9 rounded-md hover:bg-wash">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
      </button>
      {open && (
        <div className="fixed inset-0 z-50 bg-paper flex flex-col md:hidden">
          <div className="flex items-center justify-between px-4 h-14 border-b border-line">
            <span className="font-bold tracking-tight">Menu</span>
            <button type="button" aria-label="Zavřít" onClick={() => setOpen(false)} className="inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-wash">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18" /></svg>
            </button>
          </div>
          <form action="/hledat" className="p-4 border-b border-line flex gap-2">
            <input name="q" placeholder="Hledat na webu" className="field" aria-label="Hledat" />
            <button className="btn btn-primary" type="submit">Hledat</button>
          </form>
          <nav className="flex-1 overflow-auto px-4 py-2">
            <Link href="/" onClick={() => setOpen(false)} className="block py-3 border-b border-line headline-sm text-xl">Domů</Link>
            {categories.map((c) => (
              <Link key={c.id} href={`/rubrika/${c.slug}`} onClick={() => setOpen(false)} className="block py-3 border-b border-line headline-sm text-xl">{c.name}</Link>
            ))}
            <div className="py-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted">
              <Link href="/o-nas" onClick={() => setOpen(false)}>O nás</Link>
              <Link href="/newsletter" onClick={() => setOpen(false)}>Newsletter</Link>
              <Link href="/rss.xml">RSS</Link>
              <Link href="/admin">Redakce</Link>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
