"use client";

import { logout } from "@/app/actions/auth";

export function AdminNav({
  adminName,
  adminRole,
}: {
  adminName: string;
  adminRole: string;
}) {
  return (
    <header className="flex items-center justify-between border-b border-line px-4 py-3">
      <div>
        <p className="font-mono text-xs tracking-widest text-ink-faint uppercase">
          Detektivky.cz — administrace
        </p>
        <p className="text-sm text-ink-muted">
          {adminName} · {adminRole}
        </p>
      </div>
      <form action={logout}>
        <button
          type="submit"
          className="rounded px-3 py-1.5 text-sm text-ink-faint hover:bg-navy-800 hover:text-white"
        >
          Odhlásit se
        </button>
      </form>
    </header>
  );
}
