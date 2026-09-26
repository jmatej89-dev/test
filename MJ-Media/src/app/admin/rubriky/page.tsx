import { listCategories } from "@/lib/articles";
import { createCategoryAction, deleteCategoryAction, moveCategoryAction, updateCategoryAction } from "@/actions/categories";
import { ConfirmButton } from "@/components/admin/ConfirmButton";

export default function CategoriesPage() {
  const cats = listCategories();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Rubriky</h1>
        <p className="hint">Pořadí rubrik určuje pořadí v hlavní navigaci webu.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px] items-start">
        <div className="card divide-y divide-line">
          {cats.map((c, i) => (
            <div key={c.id} className="p-4 flex flex-col gap-3">
              <form action={updateCategoryAction} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] items-end">
                <input type="hidden" name="id" value={c.id} />
                <div>
                  <label className="label">Název</label>
                  <input name="name" defaultValue={c.name} className="field" required />
                </div>
                <div>
                  <label className="label">URL (slug)</label>
                  <input name="slug" defaultValue={c.slug} className="field" />
                </div>
                <button className="btn btn-ghost" type="submit">Uložit</button>
                <div className="sm:col-span-3">
                  <label className="label">Popis</label>
                  <input name="description" defaultValue={c.description} className="field" placeholder="Krátký popis rubriky (zobrazí se v záhlaví rubriky)" />
                </div>
              </form>
              <div className="flex items-center justify-between">
                <p className="hint">{c.article_count} publikovaných · /rubrika/{c.slug}</p>
                <div className="flex gap-1">
                  <form action={moveCategoryAction}><input type="hidden" name="id" value={c.id} /><input type="hidden" name="dir" value="up" /><button className="btn btn-ghost btn-sm btn-icon" disabled={i === 0} title="Posunout výš">↑</button></form>
                  <form action={moveCategoryAction}><input type="hidden" name="id" value={c.id} /><input type="hidden" name="dir" value="down" /><button className="btn btn-ghost btn-sm btn-icon" disabled={i === cats.length - 1} title="Posunout níž">↓</button></form>
                  <form action={deleteCategoryAction}>
                    <input type="hidden" name="id" value={c.id} />
                    <ConfirmButton message={`Smazat rubriku „${c.name}“? Články v ní zůstanou, jen bez rubriky.`}>Smazat</ConfirmButton>
                  </form>
                </div>
              </div>
            </div>
          ))}
          {cats.length === 0 && <p className="p-8 text-center text-sm text-muted">Zatím žádné rubriky.</p>}
        </div>

        <form action={createCategoryAction} className="card p-4 space-y-3">
          <h2 className="font-semibold text-sm">Nová rubrika</h2>
          <div>
            <label className="label">Název</label>
            <input name="name" className="field" placeholder="např. Sport" required />
          </div>
          <div>
            <label className="label">Popis</label>
            <input name="description" className="field" placeholder="volitelné" />
          </div>
          <button className="btn btn-primary w-full" type="submit">Přidat rubriku</button>
        </form>
      </div>
    </div>
  );
}
