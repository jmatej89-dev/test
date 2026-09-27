import type { Metadata } from "next";
import { getSettings } from "@/lib/settings";
import { Logo } from "@/components/Logo";
import { NewsletterForm } from "@/components/NewsletterForm";

export const metadata: Metadata = { title: "O nás" };

export default function AboutPage() {
  const s = getSettings();
  return (
    <div className="pt-8 sm:pt-12 grid gap-12 lg:grid-cols-12">
      <div className="lg:col-span-7">
        <p className="kicker">O nás</p>
        <h1 className="headline text-[2.6rem] sm:text-[3.2rem] mt-2">{s.site_name}</h1>
        {s.tagline && <p className="dek mt-4 text-xl text-ink-2">{s.tagline}</p>}
        <div className="prose-article mt-8">
          {(s.about || "").split(/\n{2,}/).filter(Boolean).map((p, i) => <p key={i}>{p}</p>)}
        </div>
      </div>
      <aside className="lg:col-span-4 lg:col-start-9 space-y-8">
        <div className="rounded-lg bg-wash p-6">
          <Logo size={30} />
          <p className="mt-4 text-sm text-ink-2 leading-relaxed">Nezávislé médium, které píše přehledně, bez balastu a s důrazem na kontext.</p>
        </div>
        <div>
          <p className="section-title border-t-2 border-ink pt-3">Newsletter</p>
          <p className="mt-2 text-sm text-ink-2">Výběr toho nejdůležitějšího jednou týdně.</p>
          <div className="mt-3"><NewsletterForm compact /></div>
        </div>
        {(s.contact_email || s.social_x || s.social_instagram || s.social_facebook) && (
          <div>
            <p className="section-title border-t-2 border-ink pt-3">Kontakt</p>
            <ul className="mt-3 space-y-1.5 text-sm">
              {s.contact_email && <li><a className="hover:text-accent" href={`mailto:${s.contact_email}`}>{s.contact_email}</a></li>}
              {s.social_x && <li><a className="hover:text-accent" href={s.social_x} target="_blank" rel="noopener noreferrer">X</a></li>}
              {s.social_instagram && <li><a className="hover:text-accent" href={s.social_instagram} target="_blank" rel="noopener noreferrer">Instagram</a></li>}
              {s.social_facebook && <li><a className="hover:text-accent" href={s.social_facebook} target="_blank" rel="noopener noreferrer">Facebook</a></li>}
            </ul>
          </div>
        )}
      </aside>
    </div>
  );
}
