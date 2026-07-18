import { getAuthorizedBox } from "@/lib/dal";
import { PortalNav } from "./PortalNav";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const box = await getAuthorizedBox();

  return (
    <div className="flex min-h-screen flex-1 flex-col">
      <header className="border-b border-line px-4 py-3">
        <p className="font-mono text-xs tracking-widest text-accent uppercase">
          Detektivky.cz — případ
        </p>
        <h1 className="text-lg font-semibold">{box.case.title}</h1>
      </header>
      <PortalNav />
      <main className="flex-1 px-4 py-6">{children}</main>
    </div>
  );
}
