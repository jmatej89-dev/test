"use client";

import { useActionState } from "react";
import { loginAction } from "@/actions/auth";

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(loginAction, undefined);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      <div>
        <label className="label" htmlFor="password">Heslo</label>
        <input id="password" name="password" type="password" className="field" autoFocus autoComplete="current-password" required />
      </div>
      {state?.error && <p className="text-sm text-accent font-medium">{state.error}</p>}
      <button className="btn btn-primary w-full" type="submit" disabled={pending}>{pending ? "Přihlašuji…" : "Přihlásit se"}</button>
    </form>
  );
}
