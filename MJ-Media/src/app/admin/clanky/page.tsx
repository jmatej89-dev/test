import Link from "next/link";
import { listAdmin, listCategories } from "@/lib/articles";
import { formatShort, relativeTime } from "@/lib/format";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { deleteArticleAction, setStatusAction } from "@/actions/articles";
import { ConfirmButton } from "@/components/admin/ConfirmButton";

type SP = { stav?: string; q?: string; rubrika?: string };
const TABS = [
  ["all", "Vše"], ["published", "Publikované"], ["scheduled", "Naplánované"], ["draft", "Koncepty"],
] as const;

export default async function ArticlesPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const status = (TABS.some(([k]) => k === sp.stav) ? sp.stav : "all") as "all" | "published" | "scheduled" | "draft";
  const categoryId = sp.rubrika ? Number(sp.rubrika) : undefined;
  const items = listAdmin({ status, q: sp.q, categoryId });
  const categories = listCategories();
  const qs = (patch: Partial<SP>) => {
    const p = new URLSearchParams();
    const merged = { ...sp, ...patch };
    for (const [k, v] of Object.entries(merged)) if (v) p.set(k, String(v));
    const s = p.toString();
    return `/admin/clanky${s ? `?${s}` : ""}`;
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Články</h1>
          <p className="hint">{items.length} položek</p>
        </div>
        <Link href="/admin/clanky/novy" className="btn btn-accent">+ Nový článek</Link>
      </div>

      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="flex gap-1 bg-wash rounded-lg p-1">
          {TABS.map(([key, label]) => (
            <Link key={key} href={qs({ stav: key === "all" ? undefined : key })} className={`px-3 py-1.5 rounded-md text-xs font-semibold ${status === key ? "bg-surface shadow-sm text-ink" : "text-muted hover:text-ink"}`}>{label}</Link>
          ))}
        </div>
        <form className="flex gap-2 items-center" action="/admin/clanky">
          {status !== "all" && <input type="hidden" name="stav" value={status} />}
          <select name="rubrika" defaultValue={sp.rubrika ?? ""} className="field w-auto py-1.5 text-xs">
            <option value="">Všechny rubriky</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <input name="q" defaultValue={sp.q ?? ""} placeholder="Hledat v titulcích…" className="field w-48 py-1.5 text-xs" />
          <button className="btn btn-ghost btn-sm" type="submit">Filtrovat</button>
        </form>
      </div>

      <div className="card overflow-x-auto">
        <table className="tbl">
          <thead>
            <tr>
              <th className="w-[46%]">Titulek</th>
              <th>Rubrika</th>
              <th>Stav</th>
              <th>Publikováno</th>
              <th className="num text-right">Zobrazení</th>
              <th className="text-right">Akce</th>
            </tr>
          </thead>
          <tbody>
            {items.map((a) => (
              <tr key={a.id}>
                <td>
                  <Link href={`/admin/clanky/${a.id}`} className="font-medium hover:text-accent line-clamp-2">{a.title}</Link>
                  <p className="hint">upraveno {relativeTime(a.updated_at)}{a.featured ? " · " : ""}{a.featured ? <span className="badge badge-featured">Hlavní</span> : null}</p>
                </td>
                <td className="text-muted">{a.category_name ?? "—"}</td>
                <td><StatusBadge article={a} /></td>
                <td className="text-muted num">{formatShort(a.published_at) || "—"}</td>
                <td className="num text-right text-muted">{a.views}</td>
                <td>
                  <div className="flex justify-end gap-1">
                    <Link href={`/admin/clanky/${a.id}`} className="btn btn-ghost btn-sm">Upravit</Link>
                    {a.status === "published" ? (
                      <Link href={`/clanek/${a.slug}`} target="_blank" className="btn btn-ghost btn-sm" title="Zobrazit na webu">↗</Link>
                    ) : (
                      <form action={setStatusAction}>
                        <input type="hidden" name="id" value={a.id} />
                        <input type="hidden" name="status" value="published" />
                        <button className="btn btn-ghost btn-sm" type="submit">Publikovat</button>
                      </form>
                    )}
                    <form action={deleteArticleAction}>
                      <input type="hidden" name="id" value={a.id} />
                      <ConfirmButton message={`Opravdu smazat článek „${a.title}“? Tuto akci nelze vrátit.`} className="btn btn-danger btn-sm btn-icon">✕</ConfirmButton>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr><td colSpan={6} className="text-center text-muted py-10">Nic tu není. <Link href="/admin/clanky/novy" className="underline">Napište první článek.</Link></td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
