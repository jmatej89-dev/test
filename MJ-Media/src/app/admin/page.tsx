import Link from "next/link";
import { adminStats, listAdmin, topArticles } from "@/lib/articles";
import { countSubscribers } from "@/lib/newsletter";
import { formatDate, relativeTime } from "@/lib/format";
import { StatusBadge } from "@/components/admin/StatusBadge";

export default function DashboardPage() {
  const stats = adminStats();
  const recent = listAdmin().slice(0, 8);
  const drafts = listAdmin({ status: "draft" }).slice(0, 5);
  const scheduled = listAdmin({ status: "scheduled" });
  const top = topArticles(5);
  const tiles = [
    { label: "Publikováno", value: stats.published, href: "/admin/clanky?stav=published" },
    { label: "Koncepty", value: stats.drafts, href: "/admin/clanky?stav=draft" },
    { label: "Naplánováno", value: stats.scheduled, href: "/admin/clanky?stav=scheduled" },
    { label: "Zobrazení celkem", value: stats.views, href: "/admin/clanky" },
    { label: "Odběratelé", value: countSubscribers(), href: "/admin/odberatele" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Přehled</h1>
          <p className="hint">{formatDate(new Date().toISOString())}</p>
        </div>
        <Link href="/admin/clanky/novy" className="btn btn-accent">+ Nový článek</Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {tiles.map((t) => (
          <Link key={t.label} href={t.href} className="stat-tile">
            <p className="text-[0.7rem] uppercase tracking-wider text-muted font-semibold">{t.label}</p>
            <p className="num text-3xl font-bold mt-1">{t.value.toLocaleString("cs-CZ")}</p>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <section className="card">
          <header className="flex items-center justify-between px-4 py-3 border-b border-line">
            <h2 className="font-semibold text-sm">Naposledy upravené</h2>
            <Link href="/admin/clanky" className="text-xs font-semibold text-muted hover:text-accent">Všechny články →</Link>
          </header>
          <ul>
            {recent.map((a) => (
              <li key={a.id} className="flex items-center gap-3 px-4 py-3 border-b border-line last:border-b-0">
                <div className="min-w-0 flex-1">
                  <Link href={`/admin/clanky/${a.id}`} className="font-medium text-sm hover:text-accent line-clamp-1">{a.title}</Link>
                  <p className="hint mt-0.5">{a.category_name ?? "Bez rubriky"} · upraveno {relativeTime(a.updated_at)}</p>
                </div>
                <StatusBadge article={a} />
              </li>
            ))}
            {recent.length === 0 && <li className="px-4 py-8 text-center text-sm text-muted">Zatím žádné články.</li>}
          </ul>
        </section>

        <div className="space-y-6">
          <section className="card">
            <header className="px-4 py-3 border-b border-line"><h2 className="font-semibold text-sm">Rozepsané koncepty</h2></header>
            <ul>
              {drafts.map((a) => (
                <li key={a.id} className="px-4 py-2.5 border-b border-line last:border-b-0">
                  <Link href={`/admin/clanky/${a.id}`} className="text-sm hover:text-accent line-clamp-1">{a.title}</Link>
                </li>
              ))}
              {drafts.length === 0 && <li className="px-4 py-6 text-center text-sm text-muted">Žádné koncepty. Skvělé.</li>}
            </ul>
          </section>
          {scheduled.length > 0 && (
            <section className="card">
              <header className="px-4 py-3 border-b border-line"><h2 className="font-semibold text-sm">Naplánované</h2></header>
              <ul>
                {scheduled.map((a) => (
                  <li key={a.id} className="px-4 py-2.5 border-b border-line last:border-b-0">
                    <Link href={`/admin/clanky/${a.id}`} className="text-sm hover:text-accent line-clamp-1">{a.title}</Link>
                    <p className="hint">{formatDate(a.published_at, true)}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}
          <section className="card">
            <header className="px-4 py-3 border-b border-line"><h2 className="font-semibold text-sm">Nejčtenější</h2></header>
            <ol>
              {top.map((a, i) => (
                <li key={a.id} className="flex items-center gap-3 px-4 py-2.5 border-b border-line last:border-b-0">
                  <span className="num text-xs font-bold text-muted w-4">{i + 1}</span>
                  <Link href={`/admin/clanky/${a.id}`} className="text-sm hover:text-accent line-clamp-1 flex-1">{a.title}</Link>
                  <span className="num text-xs text-muted">{a.views}</span>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>
    </div>
  );
}
