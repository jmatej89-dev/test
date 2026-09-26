import { listPublished } from "@/lib/articles";
import { getSettings, siteUrl } from "@/lib/settings";

export const dynamic = "force-dynamic";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function GET() {
  const s = getSettings();
  const base = siteUrl();
  const items = listPublished({ limit: 30 })
    .map((a) => `
    <item>
      <title>${esc(a.title)}</title>
      <link>${base}/clanek/${a.slug}</link>
      <guid isPermaLink="true">${base}/clanek/${a.slug}</guid>
      <pubDate>${new Date(a.published_at!).toUTCString()}</pubDate>
      ${a.category_name ? `<category>${esc(a.category_name)}</category>` : ""}
      <description>${esc(a.perex)}</description>
    </item>`)
    .join("");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${esc(s.site_name)}</title>
    <link>${base}</link>
    <description>${esc(s.tagline)}</description>
    <language>cs</language>
    <atom:link href="${base}/rss.xml" rel="self" type="application/rss+xml" />${items}
  </channel>
</rss>`;
  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } });
}
