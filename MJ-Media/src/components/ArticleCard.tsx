import Link from "next/link";
import type { Article } from "@/lib/articles";
import { formatDate, relativeTime } from "@/lib/format";
import { readingMinutes } from "@/lib/markdown";

export function Cover({ article, className = "", sizesHint = "" }: { article: Article; className?: string; sizesHint?: string }) {
  if (!article.cover_image) return null;
  return (
    <div className={`overflow-hidden bg-wash ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={article.cover_image} alt={article.cover_caption || article.title} className="w-full h-full object-cover" loading="lazy" sizes={sizesHint || undefined} />
    </div>
  );
}

export function CategoryLabel({ article }: { article: Article }) {
  if (!article.category_slug) return null;
  return (
    <Link href={`/rubrika/${article.category_slug}`} className="kicker hover:underline">{article.category_name}</Link>
  );
}

export function Meta({ article, relative = false }: { article: Article; relative?: boolean }) {
  return (
    <p className="meta">
      <time dateTime={article.published_at ?? undefined}>{relative ? relativeTime(article.published_at!) : formatDate(article.published_at)}</time>
      <span className="mx-1.5">·</span>
      <span>{readingMinutes(article.content)} min čtení</span>
    </p>
  );
}

/** Hlavní článek dne */
export function LeadCard({ article }: { article: Article }) {
  return (
    <article className="grid gap-5 md:grid-cols-[3fr_2fr] md:items-center hover-title">
      <Link href={`/clanek/${article.slug}`} className="block link-quiet">
        <Cover article={article} className="aspect-[16/10] rounded-sm" />
      </Link>
      <div>
        <CategoryLabel article={article} />
        <h2 className="headline text-[2rem] md:text-[2.4rem] mt-2 transition-colors">
          <Link href={`/clanek/${article.slug}`} className="link-quiet">{article.title}</Link>
        </h2>
        <p className="mt-3 text-[1.02rem] text-ink-2 leading-relaxed">{article.perex}</p>
        <div className="mt-4"><Meta article={article} /></div>
      </div>
    </article>
  );
}

/** Karta s obrázkem nahoře */
export function GridCard({ article, big = false }: { article: Article; big?: boolean }) {
  return (
    <article className="hover-title flex flex-col">
      {article.cover_image && (
        <Link href={`/clanek/${article.slug}`} className="block link-quiet mb-3">
          <Cover article={article} className="aspect-[16/10] rounded-sm" />
        </Link>
      )}
      <CategoryLabel article={article} />
      <h3 className={`headline mt-1.5 transition-colors ${big ? "text-2xl" : "text-[1.25rem]"}`}>
        <Link href={`/clanek/${article.slug}`} className="link-quiet">{article.title}</Link>
      </h3>
      {big && <p className="mt-2 text-[0.95rem] text-ink-2 leading-relaxed">{article.perex}</p>}
      <div className="mt-2"><Meta article={article} /></div>
    </article>
  );
}

/** Kompaktní řádek (seznam nejnovějších, výsledky) */
export function RowCard({ article, showPerex = false }: { article: Article; showPerex?: boolean }) {
  return (
    <article className="hover-title grid gap-4 grid-cols-[1fr_auto] py-4 border-b border-line last:border-b-0">
      <div>
        <CategoryLabel article={article} />
        <h3 className="headline text-[1.25rem] mt-1 transition-colors">
          <Link href={`/clanek/${article.slug}`} className="link-quiet">{article.title}</Link>
        </h3>
        {showPerex && <p className="mt-1.5 text-[0.95rem] text-ink-2">{article.perex}</p>}
        <div className="mt-1.5"><Meta article={article} /></div>
      </div>
      {article.cover_image && (
        <Link href={`/clanek/${article.slug}`} className="link-quiet">
          <Cover article={article} className="w-28 h-20 sm:w-40 sm:h-28 rounded-sm" />
        </Link>
      )}
    </article>
  );
}

/** Položka v postranním panelu „Nejnovější“ */
export function TickerItem({ article }: { article: Article }) {
  const d = article.published_at ? new Date(article.published_at) : null;
  const time = d ? `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}` : "";
  return (
    <li className="hover-title grid grid-cols-[3.2rem_1fr] gap-2 py-3 border-b border-line last:border-b-0">
      <span className="num text-[0.78rem] font-semibold text-accent pt-0.5">{time}</span>
      <div>
        <h3 className="title text-[0.95rem] font-semibold leading-snug transition-colors">
          <Link href={`/clanek/${article.slug}`} className="link-quiet">{article.title}</Link>
        </h3>
        <p className="meta mt-0.5">{article.category_name ?? ""}{article.category_name ? " · " : ""}{relativeTime(article.published_at!)}</p>
      </div>
    </li>
  );
}

export function SectionHeading({ title, href, count }: { title: string; href?: string; count?: number }) {
  return (
    <div className="flex items-baseline justify-between border-t-2 border-ink pt-2 mb-5">
      <h2 className="text-[1.05rem] font-bold tracking-tight">
        {href ? <Link href={href} className="hover:text-accent">{title}</Link> : title}
      </h2>
      {href && <Link href={href} className="text-xs font-semibold text-muted hover:text-accent">Všechny{typeof count === "number" ? ` (${count})` : ""} →</Link>}
    </div>
  );
}
