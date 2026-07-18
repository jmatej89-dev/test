import Link from "next/link";
import { formatCzk } from "@/lib/format";

export type CatalogCase = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  teaser: string | null;
  difficulty: number;
  priceCzk: number | null;
  coverImageUrl: string | null;
};

function DifficultyDots({ level }: { level: number }) {
  return (
    <span className="inline-flex gap-1" aria-label={`Obtížnost ${level} z 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span
          key={i}
          className={`h-1.5 w-1.5 rounded-full ${
            i < level ? "bg-accent" : "bg-line"
          }`}
        />
      ))}
    </span>
  );
}

export function CaseCard({ item }: { item: CatalogCase }) {
  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-line bg-navy-900/60 transition hover:border-accent">
      {item.coverImageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.coverImageUrl}
          alt={item.title}
          className="h-40 w-full object-cover"
        />
      ) : (
        <div className="flex h-40 w-full items-center justify-center bg-navy-800">
          <span className="font-mono text-xs tracking-widest text-ink-faint uppercase">
            Spis případu
          </span>
        </div>
      )}
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold">{item.title}</h3>
          <DifficultyDots level={item.difficulty} />
        </div>
        {(item.teaser || item.subtitle) && (
          <p className="mt-2 text-sm text-ink-muted">
            {item.teaser ?? item.subtitle}
          </p>
        )}
        <div className="mt-4 flex items-center justify-between gap-3">
          {item.priceCzk != null ? (
            <span className="font-mono text-lg font-bold text-accent">
              {formatCzk(item.priceCzk)}
            </span>
          ) : (
            <span className="text-sm text-ink-faint">Cena na dotaz</span>
          )}
          <Link
            href={`/objednat/${item.slug}`}
            className="rounded bg-accent px-4 py-1.5 text-sm font-semibold text-navy-950 hover:bg-accent/90"
          >
            Chci tento případ
          </Link>
        </div>
      </div>
    </div>
  );
}
