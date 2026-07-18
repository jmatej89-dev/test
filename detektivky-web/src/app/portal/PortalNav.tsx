"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/actions/auth";

const TABS = [
  { href: "/portal/spis", label: "Spis" },
  { href: "/portal/dukazy", label: "Důkazy" },
  { href: "/portal/odposlechy", label: "Odposlechy" },
  { href: "/portal/emaily", label: "E-maily" },
  { href: "/portal/databaze", label: "Databáze osob" },
  { href: "/portal/reseni", label: "Řešení" },
];

export function PortalNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap items-center gap-1 border-b border-neutral-800 px-4 py-2">
      {TABS.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`rounded px-3 py-1.5 text-sm transition ${
              active
                ? "bg-amber-600 text-neutral-950 font-medium"
                : "text-neutral-400 hover:bg-neutral-800 hover:text-neutral-100"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
      <form action={logout} className="ml-auto">
        <button
          type="submit"
          className="rounded px-3 py-1.5 text-sm text-neutral-500 hover:bg-neutral-800 hover:text-neutral-100"
        >
          Odhlásit se
        </button>
      </form>
    </nav>
  );
}
