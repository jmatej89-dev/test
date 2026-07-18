import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { togglePublishCase, revokeBox, reactivateBox } from "@/app/actions/admin";
import { CreateCaseForm } from "./CreateCaseForm";
import { CreateBoxForm } from "./CreateBoxForm";
import { ResetPasswordButton } from "./ResetPasswordButton";

export const metadata: Metadata = {
  title: "Administrace — Detektivky.cz",
  robots: { index: false, follow: false },
};

export default async function AdminDashboard() {
  const [cases, boxes] = await Promise.all([
    prisma.case.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { boxes: true } } },
    }),
    prisma.box.findMany({
      orderBy: { createdAt: "desc" },
      include: { case: { select: { title: true } } },
      take: 50,
    }),
  ]);

  return (
    <div className="mx-auto max-w-4xl space-y-10">
      <section>
        <h2 className="mb-3 text-lg font-semibold text-amber-500">
          Nový případ
        </h2>
        <CreateCaseForm />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-amber-500">Případy</h2>
        <div className="overflow-x-auto rounded-lg border border-neutral-800">
          <table className="w-full text-sm">
            <thead className="bg-neutral-900 text-left text-neutral-400">
              <tr>
                <th className="px-3 py-2">Název</th>
                <th className="px-3 py-2">Slug</th>
                <th className="px-3 py-2">Krabic</th>
                <th className="px-3 py-2">Stav</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {cases.map((c) => (
                <tr key={c.id} className="border-t border-neutral-800">
                  <td className="px-3 py-2">
                    <Link
                      href={`/admin/pripady/${c.id}`}
                      className="hover:text-amber-500 hover:underline"
                    >
                      {c.title}
                    </Link>
                  </td>
                  <td className="px-3 py-2 font-mono text-xs text-neutral-500">
                    {c.slug}
                  </td>
                  <td className="px-3 py-2">{c._count.boxes}</td>
                  <td className="px-3 py-2">
                    {c.isPublished ? (
                      <span className="text-green-400">publikováno</span>
                    ) : (
                      <span className="text-neutral-500">koncept</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <Link
                        href={`/admin/pripady/${c.id}`}
                        className="text-xs text-amber-500 hover:underline"
                      >
                        Spravovat obsah
                      </Link>
                      <form action={togglePublishCase.bind(null, c.id)}>
                        <button
                          type="submit"
                          className="text-xs text-neutral-400 hover:text-neutral-100"
                        >
                          {c.isPublished ? "Skrýt" : "Publikovat"}
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
              {cases.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-4 text-neutral-500">
                    Zatím žádné případy.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-amber-500">
          Nová krabice (přihlašovací údaje pro zákazníka)
        </h2>
        <CreateBoxForm cases={cases.map((c) => ({ id: c.id, title: c.title }))} />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-amber-500">Krabice</h2>
        <div className="overflow-x-auto rounded-lg border border-neutral-800">
          <table className="w-full text-sm">
            <thead className="bg-neutral-900 text-left text-neutral-400">
              <tr>
                <th className="px-3 py-2">Kód</th>
                <th className="px-3 py-2">Případ</th>
                <th className="px-3 py-2">Poznámka</th>
                <th className="px-3 py-2">Stav</th>
                <th className="px-3 py-2">Poslední přihlášení</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {boxes.map((b) => (
                <tr key={b.id} className="border-t border-neutral-800">
                  <td className="px-3 py-2 font-mono text-xs">{b.code}</td>
                  <td className="px-3 py-2">{b.case.title}</td>
                  <td className="px-3 py-2 text-neutral-500">
                    {b.customerLabel ?? "—"}
                  </td>
                  <td className="px-3 py-2">
                    {b.status === "ACTIVE" ? (
                      <span className="text-green-400">aktivní</span>
                    ) : (
                      <span className="text-red-400">zablokováno</span>
                    )}
                    {b.lockedUntil && b.lockedUntil > new Date() && (
                      <span className="ml-1 text-amber-400">(uzamčeno)</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-neutral-500">
                    {b.lastLoginAt
                      ? new Date(b.lastLoginAt).toLocaleString("cs-CZ")
                      : "nikdy"}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <ResetPasswordButton boxId={b.id} />
                      {b.status === "ACTIVE" ? (
                        <form action={revokeBox.bind(null, b.id)}>
                          <button
                            type="submit"
                            className="text-xs text-red-400 hover:text-red-300"
                          >
                            Zablokovat
                          </button>
                        </form>
                      ) : (
                        <form action={reactivateBox.bind(null, b.id)}>
                          <button
                            type="submit"
                            className="text-xs text-green-400 hover:text-green-300"
                          >
                            Obnovit
                          </button>
                        </form>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {boxes.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-4 text-neutral-500">
                    Zatím žádné krabice.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
