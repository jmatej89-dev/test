import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import {
  togglePublishCase,
  revokeBox,
  reactivateBox,
  markInquiryStatus,
} from "@/app/actions/admin";
import { CreateCaseForm } from "./CreateCaseForm";
import { CreateBoxForm } from "./CreateBoxForm";
import { ResetPasswordButton } from "./ResetPasswordButton";

export const metadata: Metadata = {
  title: "Administrace — Detektivky.cz",
  robots: { index: false, follow: false },
};

export default async function AdminDashboard() {
  const [cases, boxes, inquiries] = await Promise.all([
    prisma.case.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { boxes: true } } },
    }),
    prisma.box.findMany({
      orderBy: { createdAt: "desc" },
      include: { case: { select: { title: true } } },
      take: 50,
    }),
    prisma.orderInquiry.findMany({
      orderBy: { createdAt: "desc" },
      include: { case: { select: { title: true } } },
      take: 50,
    }),
  ]);

  return (
    <div className="mx-auto max-w-4xl space-y-10">
      <section>
        <h2 className="mb-3 text-lg font-semibold text-accent">
          Nový případ
        </h2>
        <CreateCaseForm />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-accent">Případy</h2>
        <div className="overflow-x-auto rounded-lg border border-line">
          <table className="w-full text-sm">
            <thead className="bg-navy-900 text-left text-ink-muted">
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
                <tr key={c.id} className="border-t border-line">
                  <td className="px-3 py-2">
                    <Link
                      href={`/admin/pripady/${c.id}`}
                      className="hover:text-accent hover:underline"
                    >
                      {c.title}
                    </Link>
                  </td>
                  <td className="px-3 py-2 font-mono text-xs text-ink-faint">
                    {c.slug}
                  </td>
                  <td className="px-3 py-2">{c._count.boxes}</td>
                  <td className="px-3 py-2">
                    {c.isPublished ? (
                      <span className="text-success">publikováno</span>
                    ) : (
                      <span className="text-ink-faint">koncept</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <Link
                        href={`/admin/pripady/${c.id}`}
                        className="text-xs text-accent hover:underline"
                      >
                        Spravovat obsah
                      </Link>
                      <form action={togglePublishCase.bind(null, c.id)}>
                        <button
                          type="submit"
                          className="text-xs text-ink-muted hover:text-white"
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
                  <td colSpan={5} className="px-3 py-4 text-ink-faint">
                    Zatím žádné případy.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-accent">
          Poptávky ({inquiries.filter((i) => i.status === "NEW").length} nových)
        </h2>
        <div className="overflow-x-auto rounded-lg border border-line">
          <table className="w-full text-sm">
            <thead className="bg-navy-900 text-left text-ink-muted">
              <tr>
                <th className="px-3 py-2">Případ</th>
                <th className="px-3 py-2">Jméno</th>
                <th className="px-3 py-2">E-mail</th>
                <th className="px-3 py-2">Zpráva</th>
                <th className="px-3 py-2">Přijato</th>
                <th className="px-3 py-2">Stav</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {inquiries.map((inq) => (
                <tr key={inq.id} className="border-t border-line">
                  <td className="px-3 py-2">{inq.case.title}</td>
                  <td className="px-3 py-2">{inq.name}</td>
                  <td className="px-3 py-2">
                    <a
                      href={`mailto:${inq.email}`}
                      className="text-accent hover:underline"
                    >
                      {inq.email}
                    </a>
                  </td>
                  <td className="max-w-xs px-3 py-2 text-ink-muted">
                    {inq.message ?? "—"}
                  </td>
                  <td className="px-3 py-2 text-ink-faint">
                    {new Date(inq.createdAt).toLocaleString("cs-CZ")}
                  </td>
                  <td className="px-3 py-2">
                    {inq.status === "NEW" && (
                      <span className="text-accent">nová</span>
                    )}
                    {inq.status === "CONTACTED" && (
                      <span className="text-ink-muted">kontaktováno</span>
                    )}
                    {inq.status === "CLOSED" && (
                      <span className="text-ink-faint">uzavřeno</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex items-center justify-end gap-3 text-xs">
                      {inq.status !== "CONTACTED" && (
                        <form action={markInquiryStatus.bind(null, inq.id, "CONTACTED")}>
                          <button type="submit" className="text-ink-muted hover:text-white">
                            Kontaktováno
                          </button>
                        </form>
                      )}
                      {inq.status !== "CLOSED" && (
                        <form action={markInquiryStatus.bind(null, inq.id, "CLOSED")}>
                          <button type="submit" className="text-ink-faint hover:text-white">
                            Uzavřít
                          </button>
                        </form>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {inquiries.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-3 py-4 text-ink-faint">
                    Zatím žádné poptávky.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-accent">
          Nová krabice (přihlašovací údaje pro zákazníka)
        </h2>
        <CreateBoxForm cases={cases.map((c) => ({ id: c.id, title: c.title }))} />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-accent">Krabice</h2>
        <div className="overflow-x-auto rounded-lg border border-line">
          <table className="w-full text-sm">
            <thead className="bg-navy-900 text-left text-ink-muted">
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
                <tr key={b.id} className="border-t border-line">
                  <td className="px-3 py-2 font-mono text-xs">{b.code}</td>
                  <td className="px-3 py-2">{b.case.title}</td>
                  <td className="px-3 py-2 text-ink-faint">
                    {b.customerLabel ?? "—"}
                  </td>
                  <td className="px-3 py-2">
                    {b.status === "ACTIVE" ? (
                      <span className="text-success">aktivní</span>
                    ) : (
                      <span className="text-danger">zablokováno</span>
                    )}
                    {b.lockedUntil && b.lockedUntil > new Date() && (
                      <span className="ml-1 text-accent">(uzamčeno)</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-ink-faint">
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
                            className="text-xs text-danger hover:text-danger/80"
                          >
                            Zablokovat
                          </button>
                        </form>
                      ) : (
                        <form action={reactivateBox.bind(null, b.id)}>
                          <button
                            type="submit"
                            className="text-xs text-success hover:text-success/80"
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
                  <td colSpan={6} className="px-3 py-4 text-ink-faint">
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
