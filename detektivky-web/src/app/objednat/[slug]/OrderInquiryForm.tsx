"use client";

import { useActionState } from "react";
import {
  submitOrderInquiry,
  type OrderInquiryFormState,
} from "@/app/actions/inquiry";

export function OrderInquiryForm({ caseId }: { caseId: string }) {
  const [state, action, pending] = useActionState<
    OrderInquiryFormState,
    FormData
  >(submitOrderInquiry, undefined);

  if (state?.ok) {
    return (
      <div className="rounded-lg border border-accent/40 bg-accent-soft p-6">
        <p className="font-semibold text-accent">Poptávka odeslána.</p>
        <p className="mt-2 text-sm text-ink-muted">
          Díky za zájem — ozveme se vám e-mailem s dalšími kroky k objednávce.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="caseId" value={caseId} />
      {/* Honeypot — hidden from real visitors, bots often fill every field. */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute -left-[9999px]"
      />
      <div className="flex flex-col gap-1">
        <label htmlFor="name" className="text-sm text-ink-muted">
          Jméno
        </label>
        <input
          id="name"
          name="name"
          required
          className="rounded border border-line bg-navy-900 px-3 py-2 text-white focus:border-accent focus:outline-none"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="email" className="text-sm text-ink-muted">
          E-mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="rounded border border-line bg-navy-900 px-3 py-2 text-white focus:border-accent focus:outline-none"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="message" className="text-sm text-ink-muted">
          Zpráva (nepovinné)
        </label>
        <textarea
          id="message"
          name="message"
          rows={3}
          className="rounded border border-line bg-navy-900 px-3 py-2 text-white focus:border-accent focus:outline-none"
        />
      </div>
      {state?.error && (
        <p role="alert" className="text-sm text-danger">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-accent px-4 py-2 font-semibold text-navy-950 hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Odesílám…" : "Mám zájem — poslat poptávku"}
      </button>
    </form>
  );
}
