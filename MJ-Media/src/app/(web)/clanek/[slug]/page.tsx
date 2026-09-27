import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublishedBySlug, incrementViews, listPublished, relatedArticles } from "@/lib/articles";
import { renderMarkdown, readingMinutes } from "@/lib/markdown";
import { formatDate } from "@/lib/format";
import { getSettings, siteUrl } from "@/lib/settings";
import { GridCard, SectionHead, TickerItem } from "@/components/ArticleCard";
import { ReadingProgress } from "@/components/ReadingProgress";
import { NewsletterForm } from "@/components/NewsletterForm";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const a = getPublishedBySlug(slug);
  if (!a) return {};
  const title = a.seo_title || a.title;
  const description = a.seo_description || a.perex;
  return {
    title, description,
    openGraph: { title, description, type: "article", publishedTime: a.published_at ?? undefined, authors: a.author ? [a.author] : undefined, images: a.cover_image ? [{ url: a.cover_image }] : undefined },
  };
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]!.toUpperCase()).join("") || "MJ";
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = getPublishedBySlug(slug);
  if (!article) notFound();
  incrementViews(article.id);
  const settings = getSettings();
  const html = renderMarkdown(article.content);
  const related = relatedArticles(article, 3);
  const latest = listPublished({ limit: 5, excludeIds: [article.id] });
  const url = `${siteUrl()}/clanek/${article.slug}`;
  const share = encodeURIComponent(url);
  const shareText = encodeURIComponent(article.title);
  const author = article.author || settings.author_name;

  return (
    <article className="pt-8 sm:pt-12">
      <ReadingProgress />
      <header className="mx-auto max-w-3xl">
        <nav className="meta mb-5" aria-label="Drobečková navigace">
          <Link href="/" className="hover:text-accent">Domů</Link>
          {article.category_slug && (<><span className="mx-2 text-faint">/</span><Link href={`/rubrika/${article.category_slug}`} className="hover:text-accent">{article.category_name}</Link></>)}
        </nav>
        {article.category_slug && <Link href={`/rubrika/${article.category_slug}`} className="kicker">{article.category_name}</Link>}
        <h1 className="headline text-[2.3rem] sm:text-[3rem] lg:text-[3.4rem] mt-3">{article.title}</h1>
        {article.perex && <p className="dek mt-6 text-[1.35rem] leading-[1.45] text-ink-2">{article.perex}</p>}
        <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-line pt-5">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-ink text-white text-[0.7rem] font-bold tracking-wider" aria-hidden="true">{initials(author)}</span>
            <div className="leading-tight">
              <p className="text-sm font-semibold">{author}</p>
              <p className="meta"><time dateTime={article.published_at ?? undefined}>{formatDate(article.published_at, true)}</time> · {readingMinutes(article.content)} min čtení</p>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-1.5 text-xs font-semibold text-muted">
            <span className="mr-1">Sdílet</span>
            <a className="btn btn-ghost btn-sm" href={`https://x.com/intent/tweet?url=${share}&text=${shareText}`} target="_blank" rel="noopener noreferrer">X</a>
            <a className="btn btn-ghost btn-sm" href={`https://www.facebook.com/sharer/sharer.php?u=${share}`} target="_blank" rel="noopener noreferrer">Facebook</a>
            <a className="btn btn-ghost btn-sm" href={`mailto:?subject=${shareText}&body=${share}`}>E-mail</a>
          </div>
        </div>
      </header>

      {article.cover_image && (
        <figure className="mt-10">
          <div className="img-frame aspect-[16/9] sm:aspect-[2/1]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={article.cover_image} alt={article.cover_caption || article.title} />
          </div>
          {article.cover_caption && <figcaption className="meta mt-2.5">{article.cover_caption}</figcaption>}
        </figure>
      )}

      <div className="mt-12 grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-8 lg:col-start-3">
          <div className="prose-article" dangerouslySetInnerHTML={{ __html: html }} />

          <footer className="mt-12 border-t border-line pt-6">
            {article.tags.length > 0 && (
              <ul className="flex flex-wrap gap-2">
                {article.tags.map((t) => (
                  <li key={t.id}><Link href={`/tema/${t.slug}`} className="inline-block rounded-full border border-line-strong px-3.5 py-1.5 text-[0.78rem] font-semibold hover:border-ink hover:bg-surface">{t.name}</Link></li>
                ))}
              </ul>
            )}
            <div className="mt-8 rounded-lg bg-wash p-6 flex flex-col sm:flex-row gap-5 sm:items-center">
              <span className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-ink text-white text-sm font-bold tracking-wider">{initials(author)}</span>
              <div className="flex-1">
                <p className="section-title">Autor</p>
                <p className="font-serif text-xl font-semibold mt-1">{author}</p>
                <p className="text-sm text-ink-2 mt-1">{settings.about ? settings.about.split(/\n/)[0] : settings.tagline}</p>
              </div>
            </div>
            <div className="mt-6 rounded-lg border border-line p-6">
              <p className="section-title">Newsletter</p>
              <p className="mt-2 text-sm text-ink-2">Líbil se vám text? Další vám pošleme e-mailem. Jednou týdně, bez spamu.</p>
              <div className="mt-3 max-w-md"><NewsletterForm /></div>
            </div>
          </footer>
        </div>
      </div>

      {(related.length > 0 || latest.length > 0) && (
        <section className="mt-20 grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <SectionHead title="Mohlo by vás zajímat" />
            <div className="grid gap-8 sm:grid-cols-3">{related.map((a) => <GridCard key={a.id} article={a} size="sm" />)}</div>
          </div>
          <aside className="lg:col-span-4 lg:border-l lg:border-line lg:pl-8">
            <div className="border-t-[3px] border-accent pt-2.5 mb-1"><h2 className="section-title">Nejnovější</h2></div>
            <ul>{latest.map((a) => <TickerItem key={a.id} article={a} />)}</ul>
          </aside>
        </section>
      )}
    </article>
  );
}
