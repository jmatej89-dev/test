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
        <label htmlFor="email" className="text-sm text-neutral-400">
          E-mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          className="rounded border border-neutral-700 bg-neutral-900 px-3 py-2 text-neutral-100 focus:border-amber-500 focus:outline-none"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="password" className="text-sm text-neutral-400">
          Heslo
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="rounded border border-neutral-700 bg-neutral-900 px-3 py-2 text-neutral-100 focus:border-amber-500 focus:outline-none"
        />
      </div>
      {state?.error && (
        <p role="alert" className="text-sm text-red-400">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="mt-2 rounded bg-neutral-100 px-4 py-2 font-semibold text-neutral-950 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Ověřuji…" : "Přihlásit se"}
      </button>
    </form>
  );
}
