import Link from "next/link";
import { Logo } from "./Logo";
import type { Category } from "@/lib/articles";
import type { Settings } from "@/lib/settings";

export function SiteFooter({ categories, settings }: { categories: Category[]; settings: Settings }) {
  const socials = [
    ["X", settings.social_x],
    ["Instagram", settings.social_instagram],
    ["Facebook", settings.social_facebook],
  ].filter(([, url]) => url);
  return (
    <footer className="mt-16 border-t-2 border-ink bg-paper">
      <div className="mx-auto max-w-6xl px-4 py-10 grid gap-8 md:grid-cols-[1.5fr_1fr_1fr]">
        <div>
          <Logo size={30} />
          <p className="mt-3 text-sm text-ink-2 max-w-sm leading-relaxed">{settings.about || settings.tagline}</p>
        </div>
        <div>
          <h3 className="kicker text-ink mb-3">Rubriky</h3>
          <ul className="space-y-1.5 text-sm">
            {categories.map((c) => (
              <li key={c.id}><Link href={`/rubrika/${c.slug}`} className="hover:text-accent">{c.name}</Link></li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="kicker text-ink mb-3">Web</h3>
          <ul className="space-y-1.5 text-sm">
            <li><Link href="/o-nas" className="hover:text-accent">O nás</Link></li>
            <li><Link href="/hledat" className="hover:text-accent">Hledat</Link></li>
            <li><Link href="/rss.xml" className="hover:text-accent">RSS</Link></li>
            {settings.contact_email && <li><a href={`mailto:${settings.contact_email}`} className="hover:text-accent">{settings.contact_email}</a></li>}
            {socials.map(([name, url]) => (
              <li key={name}><a href={url} target="_blank" rel="noopener noreferrer" className="hover:text-accent">{name}</a></li>
            ))}
            <li><Link href="/admin" className="text-muted hover:text-accent">Redakce</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line">
        <div className="mx-auto max-w-6xl px-4 py-4 text-[0.72rem] text-muted flex flex-wrap gap-x-4 gap-y-1 justify-between">
          <span>{settings.footer_note || `© ${new Date().getFullYear()} ${settings.site_name}`}</span>
          <span>{settings.site_name}</span>
        </div>
      </div>
    </footer>
  );
}
