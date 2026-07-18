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
    <header className="flex items-center justify-between border-b border-neutral-800 px-4 py-3">
      <div>
        <p className="font-mono text-xs tracking-widest text-neutral-500 uppercase">
          Detektivky.cz — administrace
        </p>
        <p className="text-sm text-neutral-400">
          {adminName} · {adminRole}
        </p>
      </div>
      <form action={logout}>
        <button
          type="submit"
          className="rounded px-3 py-1.5 text-sm text-neutral-500 hover:bg-neutral-800 hover:text-neutral-100"
        >
          Odhlásit se
        </button>
      </form>
    </header>
  );
}
