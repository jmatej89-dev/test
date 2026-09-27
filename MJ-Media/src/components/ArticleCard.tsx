import Link from "next/link";
import type { Article } from "@/lib/articles";
import { formatDate, relativeTime } from "@/lib/format";
import { readingMinutes } from "@/lib/markdown";

/** Zástupný blok pro články bez fotografie (drží mřížku zarovnanou). */
export function CoverPlaceholder({ article, className = "" }: { article: Article; className?: string }) {
  return (
    <div className={`img-frame relative bg-wash ${className}`} aria-hidden="true">
      <span className="absolute inset-0 flex items-center justify-center font-serif text-[5rem] leading-none text-ink/10 select-none">{article.category_name ? "“" : "MJ"}</span>
      {article.category_name && <span className="absolute left-4 bottom-3 kicker text-ink/40">{article.category_name}</span>}
    </div>
  );
}

export function Cover({ article, className = "", priority = false }: { article: Article; className?: string; priority?: boolean }) {
  if (!article.cover_image) return null;
  return (
    <div className={`img-frame ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={article.cover_image} alt={article.cover_caption || article.title} loading={priority ? "eager" : "lazy"} decoding="async" />
    </div>
  );
}

export function CategoryLabel({ article, className = "" }: { article: Article; className?: string }) {
  if (!article.category_slug) return null;
  return <Link href={`/rubrika/${article.category_slug}`} className={`kicker hover:underline underline-offset-4 ${className}`}>{article.category_name}</Link>;
}

export function Meta({ article, relative = false, author = false, className = "" }: { article: Article; relative?: boolean; author?: boolean; className?: string }) {
  return (
    <p className={`meta ${className}`}>
      {author && article.author && <><span className="font-semibold text-ink-2">{article.author}</span><span className="mx-1.5">·</span></>}
      <time dateTime={article.published_at ?? undefined}>{relative ? relativeTime(article.published_at!) : formatDate(article.published_at)}</time>
      <span className="mx-1.5">·</span>
      <span>{readingMinutes(article.content)} min</span>
    </p>
  );
}

/** Hlavní článek dne: obrázek přes celou šířku, pod ním titulek. */
export function LeadCard({ article }: { article: Article }) {
  return (
    <article className="card-link">
      {article.cover_image && (
        <Link href={`/clanek/${article.slug}`} className="block link-quiet">
          <Cover article={article} className="aspect-[3/2]" priority />
        </Link>
      )}
      <div className="pt-5 max-w-3xl">
        <CategoryLabel article={article} />
        <h2 className="headline text-[2rem] sm:text-[2.6rem] lg:text-[2.9rem] mt-2">
          <Link href={`/clanek/${article.slug}`} className="link-quiet">{article.title}</Link>
        </h2>
        <p className="dek mt-4 text-[1.15rem] leading-relaxed text-ink-2">{article.perex}</p>
        <Meta article={article} author className="mt-4" />
      </div>
    </article>
  );
}

/** Karta s obrázkem nahoře */
export function GridCard({ article, size = "md" }: { article: Article; size?: "sm" | "md" | "lg" }) {
  const title = size === "lg" ? "text-[1.6rem]" : size === "md" ? "text-[1.25rem]" : "text-[1.08rem]";
  return (
    <article className="card-link flex flex-col">
      <Link href={`/clanek/${article.slug}`} className="block link-quiet mb-3.5">
        {article.cover_image ? <Cover article={article} className="aspect-[3/2]" /> : <CoverPlaceholder article={article} className="aspect-[3/2]" />}
      </Link>
      <CategoryLabel article={article} />
      <h3 className={`headline-sm ${title} mt-1.5`}>
        <Link href={`/clanek/${article.slug}`} className="link-quiet">{article.title}</Link>
      </h3>
      {size !== "sm" && <p className="mt-2 text-[0.92rem] leading-relaxed text-ink-2 line-clamp-3">{article.perex}</p>}
      <Meta article={article} className="mt-2.5" />
    </article>
  );
}

/** Řádek: text vlevo, malý obrázek vpravo */
export function RowCard({ article, showPerex = true }: { article: Article; showPerex?: boolean }) {
  return (
    <article className="card-link grid gap-5 grid-cols-[1fr_auto] py-5 border-b border-line last:border-b-0 items-start">
      <div className="min-w-0">
        <CategoryLabel article={article} />
        <h3 className="headline-sm text-[1.3rem] mt-1.5">
          <Link href={`/clanek/${article.slug}`} className="link-quiet">{article.title}</Link>
        </h3>
        {showPerex && <p className="mt-2 text-[0.92rem] leading-relaxed text-ink-2 line-clamp-2">{article.perex}</p>}
        <Meta article={article} className="mt-2" />
      </div>
      {article.cover_image && (
        <Link href={`/clanek/${article.slug}`} className="link-quiet">
          <Cover article={article} className="w-28 sm:w-44 aspect-[3/2]" />
        </Link>
      )}
    </article>
  );
}

/** Jen titulek s metadaty (seznamy v rubrikách) */
export function HeadlineRow({ article, showCategory = false }: { article: Article; showCategory?: boolean }) {
  return (
    <article className="card-link py-3.5 border-b border-line last:border-b-0 first:pt-0">
      {showCategory && <CategoryLabel article={article} />}
      <h3 className="headline-sm text-[1.1rem]"><Link href={`/clanek/${article.slug}`} className="link-quiet">{article.title}</Link></h3>
      <Meta article={article} className="mt-1" />
    </article>
  );
}

/** Položka v panelu „Nejnovější“ */
export function TickerItem({ article }: { article: Article }) {
  const d = article.published_at ? new Date(article.published_at) : null;
  const time = d ? `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}` : "";
  return (
    <li className="card-link relative grid grid-cols-[2.6rem_1fr] gap-3 py-3 border-b border-line last:border-b-0">
      <span className="tnum text-[0.75rem] font-bold text-accent pt-[3px]">{time}</span>
      <div className="min-w-0">
        <h3 className="title text-[0.95rem] font-semibold leading-snug tracking-[-0.005em]">
          <Link href={`/clanek/${article.slug}`} className="link-quiet">{article.title}</Link>
        </h3>
        <p className="meta mt-1">{article.category_name ?? ""}{article.category_name ? " · " : ""}{relativeTime(article.published_at!)}</p>
      </div>
    </li>
  );
}

/** Číslovaná položka (Nejčtenější) */
export function RankedItem({ article, rank }: { article: Article; rank: number }) {
  return (
    <li className="card-link grid grid-cols-[2.2rem_1fr] gap-3 py-4 border-b border-line last:border-b-0 items-start">
      <span className="font-serif text-[2rem] leading-none font-medium text-faint tnum">{rank}</span>
      <div className="min-w-0 pt-0.5">
        <h3 className="headline-sm text-[1.05rem]"><Link href={`/clanek/${article.slug}`} className="link-quiet">{article.title}</Link></h3>
        <p className="meta mt-1">{article.category_name ?? ""}</p>
      </div>
    </li>
  );
}

/** Komentář v tmavé sekci */
export function OpinionCard({ article }: { article: Article }) {
  return (
    <article className="card-link relative pl-6">
      <span className="absolute left-0 top-0 font-serif text-[3rem] leading-none text-accent select-none" aria-hidden="true">“</span>
      <h3 className="headline text-[1.45rem] text-white [&:hover]:text-white">
        <Link href={`/clanek/${article.slug}`} className="link-quiet hover:text-white/80">{article.title}</Link>
      </h3>
      <p className="mt-3 text-[0.8rem] font-semibold uppercase tracking-[0.12em] text-accent">{article.author || "Redakce"}</p>
      <p className="meta text-white/45 mt-1">{formatDate(article.published_at)}</p>
    </article>
  );
}

export function SectionHead({ title, href, more = "Všechny" }: { title: string; href?: string; more?: string }) {
  return (
    <div className="section-head">
      <h2 className="section-title">{href ? <Link href={href} className="hover:text-accent">{title}</Link> : title}</h2>
      {href && <Link href={href} className="more">{more} →</Link>}
    </div>
  );
}
