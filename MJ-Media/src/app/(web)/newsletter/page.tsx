import type { Metadata } from "next";
import { NewsletterForm } from "@/components/NewsletterForm";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = { title: "Newsletter" };

export default function NewsletterPage() {
  const s = getSettings();
  return (
    <div className="pt-8 sm:pt-12 max-w-2xl">
      <p className="kicker">Newsletter</p>
      <h1 className="headline text-[2.6rem] sm:text-[3.2rem] mt-2">To nejdůležitější. Jednou týdně.</h1>
      <p className="dek mt-5 text-xl text-ink-2">Každý týden vybereme texty z {s.site_name}, které stojí za přečtení, a pošleme vám je e-mailem. Žádný spam, odhlášení jedním kliknutím.</p>
      <div className="mt-8 rounded-lg bg-wash p-6 sm:p-8"><NewsletterForm /></div>
      <ul className="mt-8 grid gap-4 sm:grid-cols-3 text-sm text-ink-2">
        <li><span className="block font-serif text-2xl font-semibold text-ink">1×</span>týdně, v neděli večer</li>
        <li><span className="block font-serif text-2xl font-semibold text-ink">5</span>vybraných textů s kontextem</li>
        <li><span className="block font-serif text-2xl font-semibold text-ink">0</span>reklamních sdělení</li>
      </ul>
    </div>
  );
}
