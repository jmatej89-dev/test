import type { Article } from "@/lib/articles";

export function articleState(a: Pick<Article, "status" | "published_at">): "draft" | "published" | "scheduled" {
  if (a.status !== "published") return "draft";
  if (a.published_at && new Date(a.published_at).getTime() > Date.now()) return "scheduled";
  return "published";
}

export function StatusBadge({ article }: { article: Pick<Article, "status" | "published_at"> }) {
  const s = articleState(article);
  const label = s === "draft" ? "Koncept" : s === "scheduled" ? "Naplánováno" : "Publikováno";
  return <span className={`badge badge-${s}`}>{label}</span>;
}
