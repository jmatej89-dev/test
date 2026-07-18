import Link from "next/link";
import { prisma } from "@/lib/db";
import { CaseCard } from "./CaseCard";

const STEPS = [
  {
    title: "Vyberete si případ",
    body: "Skutečný, nebo napínavě fikční. Objednáte přímo tady na webu.",
  },
  {
    title: "Krabice přijde domů",
    body: "Autentické fotografie, dokumenty a stopy — vše fyzické, hmatatelné, jako opravdové vyšetřování.",
  },
  {
    title: "Přihlásíte se do portálu",
    body: "Ke krabici patří jedinečné přihlašovací jméno a heslo. Přehrajete si odposlechy, přečtete zachycené e-maily, prohledáte databázi osob a časovou osu.",
  },
  {
    title: "Odhalíte pachatele",
    body: "Podáte obvinění přímo na webu a zjistíte, jestli jste případ vyřešili správně.",
  },
];

export default async function Home() {
  const cases = await prisma.case.findMany({
    where: { isPublished: true },
    select: {
      id: true,
      slug: true,
      title: true,
      subtitle: true,
      teaser: true,
      difficulty: true,
      priceCzk: true,
      coverImageUrl: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between px-6 py-5">
        <span className="font-mono text-sm tracking-widest text-accent uppercase">
          Detektivky.cz
        </span>
        <nav className="flex items-center gap-4">
          <Link
            href="#info"
            className="hidden text-sm text-ink-muted hover:text-white sm:inline"
          >
            Jak to funguje
          </Link>
          <Link
            href="/prihlaseni"
            className="rounded border border-line px-4 py-1.5 text-sm text-white hover:border-accent hover:text-accent"
          >
            Mám krabici — přihlásit se
          </Link>
        </nav>
      </header>

      <main className="flex-1">
        <section className="mx-auto max-w-3xl px-6 pt-12 pb-10 text-center">
          <h1 className="text-3xl font-bold sm:text-4xl">
            Detektivní případy, které přijdou{" "}
            <span className="text-accent">až domů</span>.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-ink-muted">
            Fyzická krabice se spisem. Online portál s odposlechy, e-maily
            a databází podezřelých. Vy jste vyšetřovatel.
          </p>
        </section>

        <section id="pripady" className="border-t border-line-soft px-6 py-14">
          <div className="mx-auto max-w-5xl">
            <h2 className="mb-8 text-2xl font-semibold">
              Případy k objednání
            </h2>
            {cases.length > 0 ? (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {cases.map((c) => (
                  <CaseCard key={c.id} item={c} />
                ))}
              </div>
            ) : (
              <p className="text-ink-faint">
                Právě chystáme nové případy — brzy tu na vás bude čekat
                nabídka. Sledujte nás, ať vám žádný neuteče.
              </p>
            )}
          </div>
        </section>

        <section
          id="info"
          className="border-t border-line-soft bg-navy-950 py-16"
        >
          <div className="mx-auto max-w-4xl px-6">
            <h2 className="mb-2 text-center text-2xl font-semibold">
              Jak to funguje
            </h2>
            <p className="mx-auto mb-10 max-w-xl text-center text-sm text-ink-muted">
              Detektivky.cz spojují fyzickou krabici se stopami a online
              vyšetřovací portál. Žádná aplikace, žádné stahování — stačí
              prohlížeč a přihlašovací údaje, které patří jen vám.
            </p>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {STEPS.map((step, i) => (
                <div
                  key={step.title}
                  className="rounded-lg border border-line p-5"
                >
                  <span className="font-mono text-sm text-accent">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="mt-2 font-semibold">{step.title}</h3>
                  <p className="mt-2 text-sm text-ink-muted">{step.body}</p>
                </div>
              ))}
            </div>

            <div className="mt-12 grid gap-6 border-t border-line-soft pt-10 sm:grid-cols-3">
              <div>
                <h3 className="font-semibold text-accent">
                  Přístup jen pro vás
                </h3>
                <p className="mt-2 text-sm text-ink-muted">
                  Každá krabice má jedinečné uživatelské jméno a heslo. Bez
                  nich se k případu nikdo jiný nedostane.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-accent">
                  Skutečné i fikční případy
                </h3>
                <p className="mt-2 text-sm text-ink-muted">
                  Vybíráme si a upravujeme známé kauzy i vymýšlíme originální
                  příběhy — vždy s důrazem na hratelnost a napětí.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-accent">
                  Žádný spěch, žádný časovač
                </h3>
                <p className="mt-2 text-sm text-ink-muted">
                  Portál je vám k dispozici tak dlouho, jak potřebujete.
                  Počet pokusů o vyřešení není omezen.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-line-soft px-6 py-8 text-center text-sm text-ink-faint">
        <p>© {new Date().getFullYear()} Detektivky.cz</p>
      </footer>
    </div>
  );
}
