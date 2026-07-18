import Link from "next/link";

const STEPS = [
  {
    title: "Objednáte si případ",
    body: "Vyberete si detektivní případ — skutečný, nebo napínavě fikční. Krabici vám pošleme domů.",
  },
  {
    title: "Otevřete spis",
    body: "V krabici najdete autentické fotografie, dokumenty a stopy. Vše fyzické, hmatatelné, jako opravdové vyšetřování.",
  },
  {
    title: "Přihlásíte se online",
    body: "Ke krabici patří jedinečné přihlašovací jméno a heslo. Na webu si přehrajete odposlechy, přečtete zachycené e-maily a prohledáte databázi osob.",
  },
  {
    title: "Odhalíte pachatele",
    body: "Až budete mít jasno, podáte obvinění přímo na webu a zjistíte, jestli jste případ vyřešili správně.",
  },
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between px-6 py-5">
        <span className="font-mono text-sm tracking-widest text-accent uppercase">
          Detektivky.cz
        </span>
        <Link
          href="/prihlaseni"
          className="rounded border border-line px-4 py-1.5 text-sm text-white hover:border-accent hover:text-accent"
        >
          Mám krabici — přihlásit se
        </Link>
      </header>

      <main className="flex-1">
        <section className="mx-auto max-w-3xl px-6 py-20 text-center">
          <h1 className="text-4xl font-bold sm:text-5xl">
            Detektivní případy, které přijdou{" "}
            <span className="text-accent">až domů</span>.
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-ink-muted">
            Fyzická krabice se spisem, fotografiemi a stopami. Online portál
            s odposlechy, e-maily a databází podezřelých. Vy jste
            vyšetřovatel.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Link
              href="/prihlaseni"
              className="rounded bg-white px-6 py-3 font-semibold text-navy-950 hover:bg-white/90"
            >
              Otevřít svůj spis
            </Link>
          </div>
        </section>

        <section className="border-t border-line-soft bg-navy-950 py-16">
          <div className="mx-auto max-w-4xl px-6">
            <h2 className="mb-10 text-center text-2xl font-semibold">
              Jak to funguje
            </h2>
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
          </div>
        </section>

        <section className="border-t border-line-soft py-16">
          <div className="mx-auto max-w-2xl px-6 text-center">
            <h2 className="text-2xl font-semibold">
              Vaše přístupové údaje patří jen vám
            </h2>
            <p className="mt-4 text-ink-muted">
              Ke každé krabici patří jedinečné uživatelské jméno a heslo,
              které vidíme jen my a vy. Bez nich se k obsahu případu nikdo
              jiný nedostane.
            </p>
          </div>
        </section>
      </main>

      <footer className="border-t border-line-soft px-6 py-8 text-center text-sm text-ink-faint">
        <p>© {new Date().getFullYear()} Detektivky.cz</p>
      </footer>
    </div>
  );
}
