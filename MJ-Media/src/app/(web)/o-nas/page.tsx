import type { Metadata } from "next";
import { getSettings } from "@/lib/settings";
import { Logo } from "@/components/Logo";

export const metadata: Metadata = { title: "O nás" };

export default function AboutPage() {
  const s = getSettings();
  return (
    <div className="py-12 max-w-2xl">
      <Logo size={48} />
      <h1 className="headline text-4xl mt-8">O {s.site_name}</h1>
      <div className="prose-article mt-6">
        {(s.about || s.tagline).split(/\n{2,}/).map((p, i) => <p key={i}>{p}</p>)}
      </div>
      {(s.contact_email || s.social_x || s.social_instagram || s.social_facebook) && (
        <div className="mt-10 border-t border-line pt-6 text-sm">
          <h2 className="kicker text-ink mb-3">Kontakt</h2>
          <ul className="space-y-1.5">
            {s.contact_email && <li><a className="hover:text-accent" href={`mailto:${s.contact_email}`}>{s.contact_email}</a></li>}
            {s.social_x && <li><a className="hover:text-accent" href={s.social_x} target="_blank" rel="noopener noreferrer">X</a></li>}
            {s.social_instagram && <li><a className="hover:text-accent" href={s.social_instagram} target="_blank" rel="noopener noreferrer">Instagram</a></li>}
            {s.social_facebook && <li><a className="hover:text-accent" href={s.social_facebook} target="_blank" rel="noopener noreferrer">Facebook</a></li>}
          </ul>
        </div>
      )}
    </div>
  );
}
