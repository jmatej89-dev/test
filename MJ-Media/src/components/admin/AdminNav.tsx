"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/admin", label: "Přehled", icon: "M3 12 12 4l9 8M5 10v10h5v-6h4v6h5V10" },
  { href: "/admin/clanky", label: "Články", icon: "M6 3h9l5 5v13H6zM14 3v6h6M9 13h6M9 17h6" },
  { href: "/admin/rubriky", label: "Rubriky", icon: "M4 6h16M4 12h16M4 18h10" },
  { href: "/admin/media", label: "Média", icon: "M4 5h16v14H4zM4 15l5-5 4 4 3-3 4 4M15 9h.01" },
  { href: "/admin/odberatele", label: "Odběratelé", icon: "M4 6h16v12H4zM4 7l8 6 8-6" },
  { href: "/admin/nastaveni", label: "Nastavení", icon: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.5-2.3.9a7 7 0 0 0-2-1.2L14.3 3h-4.6l-.3 2.5a7 7 0 0 0-2 1.2L5.1 5.8l-2 3.5 2 1.5A7 7 0 0 0 5 12c0 .4 0 .8.1 1.2l-2 1.5 2 3.5 2.3-.9a7 7 0 0 0 2 1.2l.3 2.5h4.6l.3-2.5a7 7 0 0 0 2-1.2l2.3.9 2-3.5-2-1.5c.1-.4.1-.8.1-1.2z" },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className="admin-nav space-y-0.5" aria-label="Administrace">
      {ITEMS.map((it) => {
        const active = it.href === "/admin" ? pathname === "/admin" : pathname.startsWith(it.href);
        return (
          <Link key={it.href} href={it.href} aria-current={active ? "page" : undefined}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-muted shrink-0"><path d={it.icon} /></svg>
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}
