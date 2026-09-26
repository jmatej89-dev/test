"use client";

import { useActionState } from "react";
import { saveSettingsAction } from "@/actions/settings";
import type { Settings } from "@/lib/settings";

export function SettingsForm({ settings: s }: { settings: Settings }) {
  const [state, action, pending] = useActionState(saveSettingsAction, undefined);
  return (
    <form action={action} className="space-y-6">
      <section className="card p-5 space-y-4">
        <h2 className="font-semibold text-sm">Identita</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className="label">Název webu</label><input name="site_name" defaultValue={s.site_name} className="field" required /></div>
          <div><label className="label">Výchozí autor</label><input name="author_name" defaultValue={s.author_name} className="field" /></div>
        </div>
        <div><label className="label">Slogan / popis</label><input name="tagline" defaultValue={s.tagline} className="field" /><p className="hint">Používá se jako meta popis a v RSS.</p></div>
        <div><label className="label">O nás</label><textarea name="about" defaultValue={s.about} rows={5} className="field" /><p className="hint">Zobrazí se na stránce O nás a v patičce. Odstavce oddělte prázdným řádkem.</p></div>
        <div><label className="label">Text v patičce</label><input name="footer_note" defaultValue={s.footer_note} className="field" placeholder="© MJ media" /></div>
      </section>
      <section className="card p-5 space-y-4">
        <h2 className="font-semibold text-sm">Kontakt a sociální sítě</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className="label">Kontaktní e-mail</label><input name="contact_email" type="email" defaultValue={s.contact_email} className="field" /></div>
          <div><label className="label">X (Twitter)</label><input name="social_x" defaultValue={s.social_x} className="field" placeholder="https://x.com/…" /></div>
          <div><label className="label">Instagram</label><input name="social_instagram" defaultValue={s.social_instagram} className="field" placeholder="https://instagram.com/…" /></div>
          <div><label className="label">Facebook</label><input name="social_facebook" defaultValue={s.social_facebook} className="field" placeholder="https://facebook.com/…" /></div>
        </div>
      </section>
      <div className="flex items-center gap-3">
        <button className="btn btn-primary" type="submit" disabled={pending}>{pending ? "Ukládám…" : "Uložit nastavení"}</button>
        {state?.ok && <span className="text-sm text-ok font-medium">Uloženo.</span>}
      </div>
    </form>
  );
}
