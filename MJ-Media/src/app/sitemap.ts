import type { MetadataRoute } from "next";
import { listCategories, listPublished } from "@/lib/articles";
import { siteUrl } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  return [
    { url: base, changeFrequency: "hourly", priority: 1 },
    { url: `${base}/o-nas`, priority: 0.3 },
    ...listCategories().map((c) => ({ url: `${base}/rubrika/${c.slug}`, changeFrequency: "daily" as const, priority: 0.7 })),
    ...listPublished({ limit: 5000 }).map((a) => ({ url: `${base}/clanek/${a.slug}`, lastModified: new Date(a.updated_at), priority: 0.8 })),
  ];
}
