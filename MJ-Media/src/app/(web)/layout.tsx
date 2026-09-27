import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { listCategories } from "@/lib/articles";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default function WebLayout({ children }: { children: React.ReactNode }) {
  const categories = listCategories();
  const settings = getSettings();
  return (
    <>
      <SiteHeader categories={categories} siteName={settings.site_name} tagline={settings.tagline} />
      <main className="flex-1 mx-auto w-full max-w-6xl px-4 sm:px-6">{children}</main>
      <SiteFooter categories={categories} settings={settings} />
    </>
  );
}
