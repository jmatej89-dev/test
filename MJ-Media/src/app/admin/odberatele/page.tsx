import { listSubscribers } from "@/lib/newsletter";
import { removeSubscriberAction } from "@/actions/newsletter";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { formatDate } from "@/lib/format";

export default function SubscribersPage() {
  const subs = listSubscribers();
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Odběratelé newsletteru</h1>
          <p className="hint">{subs.length} adres · sbírá se z formulářů na webu</p>
        </div>
        <a href="/admin/odberatele/export" className="btn btn-ghost" download>Stáhnout CSV</a>
      </div>
      <div className="card overflow-x-auto">
        <table className="tbl">
          <thead><tr><th>E-mail</th><th>Přihlášeno</th><th className="text-right">Akce</th></tr></thead>
          <tbody>
            {subs.map((s) => (
              <tr key={s.id}>
                <td className="font-medium">{s.email}</td>
                <td className="text-muted">{formatDate(s.created_at, true)}</td>
                <td className="text-right">
                  <form action={removeSubscriberAction} className="inline">
                    <input type="hidden" name="id" value={s.id} />
                    <ConfirmButton message={`Odebrat ${s.email} z newsletteru?`}>Odebrat</ConfirmButton>
                  </form>
                </td>
              </tr>
            ))}
            {subs.length === 0 && <tr><td colSpan={3} className="text-center text-muted py-10">Zatím se nikdo nepřihlásil.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
