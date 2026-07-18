import type { Metadata } from "next";
import { AdminLoginForm } from "./AdminLoginForm";

export const metadata: Metadata = {
  title: "Administrace — Detektivky.cz",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="font-mono text-sm tracking-widest text-neutral-500 uppercase">
            Detektivky.cz
          </p>
          <h1 className="mt-2 text-2xl font-semibold">Administrace</h1>
        </div>
        <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-6">
          <AdminLoginForm />
        </div>
      </div>
    </main>
  );
}
