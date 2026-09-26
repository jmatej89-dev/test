import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { logoutAction } from "@/actions/auth";
import { Logo } from "@/components/Logo";
import { AdminNav } from "@/components/admin/AdminNav";

export const dynamic = "force-dynamic";
export const metadata = { title: "Redakce", robots: { index: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <div className="flex-1 flex flex-col md:flex-row min-h-screen bg-paper">
      <aside className="md:w-56 md:shrink-0 border-b md:border-b-0 md:border-r border-line bg-surface md:sticky md:top-0 md:h-screen flex flex-col">
        <div className="px-4 py-4 flex items-center justify-between border-b border-line">
          <Link href="/admin" className="link-quiet"><Logo size={28} /></Link>
          <span className="badge badge-draft">Redakce</span>
        </div>
        <div className="p-3 flex-1 flex md:flex-col gap-3 md:gap-0 overflow-x-auto">
          <AdminNav />
          <div className="md:mt-4 shrink-0">
            <Link href="/admin/clanky/novy" className="btn btn-accent w-full">+ Nový článek</Link>
          </div>
        </div>
        <div className="p-3 border-t border-line flex items-center justify-between text-xs">
          <Link href="/" className="text-muted hover:text-ink" target="_blank">Zobrazit web ↗</Link>
          <form action={logoutAction}><button className="text-muted hover:text-accent font-medium" type="submit">Odhlásit</button></form>
        </div>
      </aside>
      <div className="flex-1 min-w-0">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 sm:py-8">{children}</div>
      </div>
    </div>
  );
}
