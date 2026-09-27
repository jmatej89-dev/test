import Link from "next/link";
import { Logo } from "./Logo";
import { NewsletterForm } from "./NewsletterForm";
import type { Category } from "@/lib/articles";
import type { Settings } from "@/lib/settings";

export function SiteFooter({ categories, settings }: { categories: Category[]; settings: Settings }) {
  const socials = [
    ["X", settings.social_x],
    ["Instagram", settings.social_instagram],
    ["Facebook", settings.social_facebook],
  ].filter(([, url]) => url);
  return (
    <footer className="mt-20 bg-dark text-white/80">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-14 grid gap-10 md:grid-cols-12">
        <div className="md:col-span-5">
          <Logo size={34} inverse />
          <p className="mt-5 text-[0.95rem] leading-relaxed max-w-sm text-white/65">{settings.about || settings.tagline}</p>
          {socials.length > 0 && (
            <div className="mt-5 flex gap-4 text-sm">
              {socials.map(([name, url]) => <a key={name} href={url} target="_blank" rel="noopener noreferrer" className="hover:text-white">{name}</a>)}
            </div>
          )}
        </div>
        <div className="md:col-span-2">
          <h3 className="section-title text-white mb-4">Rubriky</h3>
          <ul className="space-y-2 text-sm">
            {categories.map((c) => <li key={c.id}><Link href={`/rubrika/${c.slug}`} className="hover:text-white">{c.name}</Link></li>)}
          </ul>
        </div>
        <div className="md:col-span-2">
          <h3 className="section-title text-white mb-4">Web</h3>
          <ul className="space-y-2 text-sm">
            <li><Link href="/o-nas" className="hover:text-white">O nás</Link></li>
            <li><Link href="/newsletter" className="hover:text-white">Newsletter</Link></li>
            <li><Link href="/hledat" className="hover:text-white">Hledat</Link></li>
            <li><Link href="/rss.xml" className="hover:text-white">RSS</Link></li>
            {settings.contact_email && <li><a href={`mailto:${settings.contact_email}`} className="hover:text-white">Kontakt</a></li>}
            <li><Link href="/admin" className="text-white/40 hover:text-white">Redakce</Link></li>
          </ul>
        </div>
        <div className="md:col-span-3">
          <h3 className="section-title text-white mb-4">Newsletter</h3>
          <p className="text-sm text-white/65 mb-3">Výběr toho nejdůležitějšího. Jednou týdně, bez spamu.</p>
          <NewsletterForm compact dark />
        </div>
      </div>
      <div className="border-t border-dark-line">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-5 text-[0.72rem] text-white/45 flex flex-wrap gap-x-6 gap-y-1 justify-between">
          <span>{settings.footer_note || `© ${new Date().getFullYear()} ${settings.site_name}`}</span>
          <span>{settings.site_name} · {settings.tagline}</span>
        </div>
      </div>
    </footer>
  );
}
