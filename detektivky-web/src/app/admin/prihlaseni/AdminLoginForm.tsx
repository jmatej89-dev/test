"use client";

import { useActionState } from "react";
import { adminLogin, type AuthFormState } from "@/app/actions/auth";

export function AdminLoginForm() {
  const [state, action, pending] = useActionState<AuthFormState, FormData>(
    adminLogin,
    undefined,
  );

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="email" className="text-sm text-ink-muted">
          E-mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          className="rounded border border-line bg-navy-900 px-3 py-2 text-white focus:border-accent focus:outline-none"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="password" className="text-sm text-ink-muted">
          Heslo
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
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
        className="mt-2 rounded bg-accent px-4 py-2 font-semibold text-navy-950 transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Ověřuji…" : "Přihlásit se"}
      </button>
    </form>
  );
}
