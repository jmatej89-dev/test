import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { LoginForm } from "@/components/admin/LoginForm";
import { Logo } from "@/components/Logo";

export const metadata: Metadata = { title: "Přihlášení do redakce", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  if (await isAdmin()) redirect("/admin");
  const { next } = await searchParams;
  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8"><Logo size={44} /></div>
        <div className="card p-6 sm:p-8">
          <h1 className="text-lg font-bold tracking-tight">Přihlášení do redakce</h1>
          <p className="hint mt-1 mb-5">Zadejte heslo administrátora.</p>
          <LoginForm next={next ?? "/admin"} />
        </div>
        <p className="text-center text-xs text-muted mt-6"><a href="/" className="hover:text-ink">← Zpět na web</a></p>
      </div>
    </div>
  );
}
