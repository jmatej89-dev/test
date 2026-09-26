import { getSettings } from "@/lib/settings";
import { SettingsForm } from "@/components/admin/SettingsForm";

export default function SettingsPage() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Nastavení webu</h1>
        <p className="hint">Název, popis, patička a kontakty. Heslo do redakce se mění v souboru <code>.env</code> (ADMIN_PASSWORD).</p>
      </div>
      <SettingsForm settings={getSettings()} />
    </div>
  );
}
