import Link from "next/link";

export default function NotFound() {
  return (
    <div className="py-24 text-center max-w-md mx-auto">
      <p className="kicker">Chyba 404</p>
      <h1 className="headline text-4xl mt-2">Stránka nenalezena</h1>
      <p className="mt-3 text-ink-2">Článek byl možná přesunut nebo smazán.</p>
      <Link href="/" className="btn btn-primary mt-6">Zpět na úvod</Link>
    </div>
  );
}
