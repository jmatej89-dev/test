import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublishedBySlug, incrementViews, relatedArticles } from "@/lib/articles";
import { renderMarkdown, readingMinutes } from "@/lib/markdown";
import { formatDate } from "@/lib/format";
import { getSettings, siteUrl } from "@/lib/settings";
import { GridCard } from "@/components/ArticleCard";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const a = getPublishedBySlug(slug);
  if (!a) return {};
  const title = a.seo_title || a.title;
  const description = a.seo_description || a.perex;
  return {
    title,
    description,
    openGraph: {
      title, description, type: "article", publishedTime: a.published_at ?? undefined, authors: a.author ? [a.author] : undefined,
      images: a.cover_image ? [{ url: a.cover_image }] : undefined,
    },
  };
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = getPublishedBySlug(slug);
  if (!article) notFound();
  incrementViews(article.id);
  const settings = getSettings();
  const html = renderMarkdown(article.content);
  const related = relatedArticles(article, 3);
  const url = `${siteUrl()}/clanek/${article.slug}`;
  const share = encodeURIComponent(url);
  const shareText = encodeURIComponent(article.title);

  return (
    <article className="py-8">
      <header className="mx-auto max-w-3xl">
        <nav className="meta mb-4" aria-label="Drobečková navigace">
          <Link href="/" className="hover:text-accent">Domů</Link>
          {article.category_slug && (<>
            <span className="mx-1.5">/</span>
            <Link href={`/rubrika/${article.category_slug}`} className="hover:text-accent">{article.category_name}</Link>
          </>)}
        </nav>
        {article.category_slug && <Link href={`/rubrika/${article.category_slug}`} className="kicker">{article.category_name}</Link>}
        <h1 className="headline text-[2.2rem] sm:text-[3rem] mt-2">{article.title}</h1>
        {article.perex && <p className="mt-5 font-serif text-[1.3rem] leading-relaxed text-ink-2">{article.perex}</p>}
        <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line pt-4 text-sm">
          <span className="font-semibold">{article.author || settings.author_name}</span>
          <time className="text-muted" dateTime={article.published_at ?? undefined}>{formatDate(article.published_at, true)}</time>
          <span className="text-muted">{readingMinutes(article.content)} min čtení</span>
        </div>
      </header>

      {article.cover_image && (
        <figure className="mx-auto max-w-5xl mt-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={article.cover_image} alt={article.cover_caption || article.title} className="w-full aspect-[16/9] object-cover rounded-sm bg-wash" />
          {article.cover_caption && <figcaption className="meta mt-2">{article.cover_caption}</figcaption>}
        </figure>
      )}

      <div className="mx-auto max-w-3xl mt-10 grid gap-10 md:grid-cols-[1fr]">
        <div className="prose-article" dangerouslySetInnerHTML={{ __html: html }} />
      </div>

      <footer className="mx-auto max-w-3xl mt-12 border-t border-line pt-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {article.tags.length > 0 && (
            <ul className="flex flex-wrap gap-2">
              {article.tags.map((t) => (
                <li key={t.id}><Link href={`/tema/${t.slug}`} className="inline-block rounded-full border border-line-strong px-3 py-1 text-xs font-semibold hover:border-ink">{t.name}</Link></li>
              ))}
            </ul>
          )}
          <div className="flex items-center gap-2 text-xs font-semibold text-muted">
            <span>Sdílet:</span>
            <a className="hover:text-accent" href={`https://x.com/intent/tweet?url=${share}&text=${shareText}`} target="_blank" rel="noopener noreferrer">X</a>
            <a className="hover:text-accent" href={`https://www.facebook.com/sharer/sharer.php?u=${share}`} target="_blank" rel="noopener noreferrer">Facebook</a>
            <a className="hover:text-accent" href={`mailto:?subject=${shareText}&body=${share}`}>E-mail</a>
          </div>
        </div>
      </footer>

      {related.length > 0 && (
        <section className="mt-16">
          <div className="border-t-2 border-ink pt-2 mb-5"><h2 className="text-[1.05rem] font-bold tracking-tight">Mohlo by vás zajímat</h2></div>
          <div className="grid gap-8 sm:grid-cols-3">{related.map((a) => <GridCard key={a.id} article={a} />)}</div>
        </section>
      )}
    </article>
  );
}
