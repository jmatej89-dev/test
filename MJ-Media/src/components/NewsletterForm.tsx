"use client";

import { useActionState } from "react";
import { subscribeAction } from "@/actions/newsletter";

export function NewsletterForm({ compact = false, dark = false }: { compact?: boolean; dark?: boolean }) {
  const [state, action, pending] = useActionState(subscribeAction, undefined);
  if (state?.ok) {
    return <p className={`text-sm font-medium ${dark ? "text-white" : "text-ok"}`}>Díky! Adresu jsme uložili.</p>;
  }
  return (
    <form action={action} className={compact ? "flex gap-2" : "flex flex-col sm:flex-row gap-2"}>
      <input
        type="email" name="email" required placeholder="vas@email.cz" aria-label="E-mail"
        className={dark ? "flex-1 min-w-0 rounded-md bg-white/10 border border-white/15 px-3 py-2 text-sm text-white placeholder:text-white/40 outline-none focus:border-white/60" : "field flex-1 min-w-0"}
      />
      <button type="submit" disabled={pending} className={`btn ${dark ? "btn-light" : "btn-accent"}`}>{pending ? "…" : "Odebírat"}</button>
      {state?.error && <p className={`text-xs ${dark ? "text-white/80" : "text-accent"} sm:basis-full`}>{state.error}</p>}
    </form>
  );
}
