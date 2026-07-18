import Link from "next/link";
import type { Metadata } from "next";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "Přihlášení k případu — Detektivky.cz",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link
            href="/"
            className="font-mono text-sm tracking-widest text-amber-500 uppercase"
          >
            Detektivky.cz
          </Link>
          <h1 className="mt-2 text-2xl font-semibold">Přístup ke spisu</h1>
          <p className="mt-2 text-sm text-neutral-400">
            Přihlaste se kódem a heslem, které jste našli ve své krabici.
          </p>
        </div>
        {error === "access_revoked" && (
          <p className="mb-4 rounded border border-amber-800 bg-amber-950/50 px-3 py-2 text-sm text-amber-300">
            Přístup k tomuto spisu už není aktivní. Přihlaste se prosím znovu,
            nebo nás kontaktujte.
          </p>
        )}
        <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-6">
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
