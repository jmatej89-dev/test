import { getDb, nowIso } from "./db";
import { slugify } from "./slug";

export type Category = { id: number; name: string; slug: string; description: string; position: number; article_count?: number };
export type Tag = { id: number; name: string; slug: string };
export type ArticleStatus = "draft" | "published";

export type Article = {
  id: number;
  title: string;
  slug: string;
  perex: string;
  content: string;
  cover_image: string;
  cover_caption: string;
  category_id: number | null;
  category_name: string | null;
  category_slug: string | null;
  author: string;
  status: ArticleStatus;
  featured: number;
  seo_title: string;
  seo_description: string;
  views: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  tags: Tag[];
};

const BASE_SELECT = `
  SELECT a.*, c.name AS category_name, c.slug AS category_slug
  FROM articles a LEFT JOIN categories c ON c.id = a.category_id
`;

function attachTags(rows: Omit<Article, "tags">[]): Article[] {
  if (rows.length === 0) return [];
  const db = getDb();
  const ids = rows.map((r) => r.id);
  const placeholders = ids.map(() => "?").join(",");
  const tagRows = db
    .prepare(`SELECT at.article_id, t.id, t.name, t.slug FROM article_tags at JOIN tags t ON t.id = at.tag_id WHERE at.article_id IN (${placeholders}) ORDER BY t.name`)
    .all(...ids) as { article_id: number; id: number; name: string; slug: string }[];
  const map = new Map<number, Tag[]>();
  for (const t of tagRows) {
    if (!map.has(t.article_id)) map.set(t.article_id, []);
    map.get(t.article_id)!.push({ id: t.id, name: t.name, slug: t.slug });
  }
  return rows.map((r) => ({ ...r, tags: map.get(r.id) ?? [] }));
}

/** Veřejně viditelné = publikované s datem v minulosti. */
const PUBLIC_WHERE = `a.status = 'published' AND a.published_at IS NOT NULL AND a.published_at <= ?`;

export function listPublished(opts: { limit?: number; offset?: number; categorySlug?: string; tagSlug?: string; excludeIds?: number[]; featuredOnly?: boolean } = {}): Article[] {
  const db = getDb();
  const params: unknown[] = [nowIso()];
  let where = PUBLIC_WHERE;
  if (opts.categorySlug) { where += " AND c.slug = ?"; params.push(opts.categorySlug); }
  if (opts.tagSlug) { where += " AND a.id IN (SELECT at.article_id FROM article_tags at JOIN tags t ON t.id = at.tag_id WHERE t.slug = ?)"; params.push(opts.tagSlug); }
  if (opts.featuredOnly) where += " AND a.featured = 1";
  if (opts.excludeIds?.length) { where += ` AND a.id NOT IN (${opts.excludeIds.map(() => "?").join(",")})`; params.push(...opts.excludeIds); }
  const limit = opts.limit ?? 20;
  const offset = opts.offset ?? 0;
  const rows = db.prepare(`${BASE_SELECT} WHERE ${where} ORDER BY a.published_at DESC LIMIT ? OFFSET ?`).all(...params, limit, offset) as Omit<Article, "tags">[];
  return attachTags(rows);
}

export function countPublished(opts: { categorySlug?: string; tagSlug?: string } = {}): number {
  const params: unknown[] = [nowIso()];
  let where = PUBLIC_WHERE;
  if (opts.categorySlug) { where += " AND c.slug = ?"; params.push(opts.categorySlug); }
  if (opts.tagSlug) { where += " AND a.id IN (SELECT at.article_id FROM article_tags at JOIN tags t ON t.id = at.tag_id WHERE t.slug = ?)"; params.push(opts.tagSlug); }
  const r = getDb().prepare(`SELECT COUNT(*) AS c FROM articles a LEFT JOIN categories c ON c.id = a.category_id WHERE ${where}`).get(...params) as { c: number };
  return r.c;
}

export function getLead(): Article | null {
  const featured = listPublished({ featuredOnly: true, limit: 1 });
  if (featured[0]) return featured[0];
  return listPublished({ limit: 1 })[0] ?? null;
}

export function getPublishedBySlug(slug: string): Article | null {
  const row = getDb().prepare(`${BASE_SELECT} WHERE a.slug = ? AND ${PUBLIC_WHERE}`).get(slug, nowIso()) as Omit<Article, "tags"> | undefined;
  return row ? attachTags([row])[0] : null;
}

export function getById(id: number): Article | null {
  const row = getDb().prepare(`${BASE_SELECT} WHERE a.id = ?`).get(id) as Omit<Article, "tags"> | undefined;
  return row ? attachTags([row])[0] : null;
}

export function searchPublished(q: string, limit = 30): Article[] {
  const like = `%${q.trim()}%`;
  const rows = getDb()
    .prepare(`${BASE_SELECT} WHERE ${PUBLIC_WHERE} AND (a.title LIKE ? OR a.perex LIKE ? OR a.content LIKE ?) ORDER BY a.published_at DESC LIMIT ?`)
    .all(nowIso(), like, like, like, limit) as Omit<Article, "tags">[];
  return attachTags(rows);
}

export function incrementViews(id: number) {
  getDb().prepare("UPDATE articles SET views = views + 1 WHERE id = ?").run(id);
}

export function relatedArticles(article: Article, limit = 3): Article[] {
  const same = article.category_slug ? listPublished({ categorySlug: article.category_slug, excludeIds: [article.id], limit }) : [];
  if (same.length >= limit) return same;
  const more = listPublished({ excludeIds: [article.id, ...same.map((a) => a.id)], limit: limit - same.length });
  return [...same, ...more];
}

/* ---------- Administrace ---------- */

export type AdminFilter = { status?: "all" | "draft" | "published" | "scheduled"; q?: string; categoryId?: number };

export function listAdmin(f: AdminFilter = {}): Article[] {
  const params: unknown[] = [];
  const where: string[] = [];
  const now = nowIso();
  if (f.status === "draft") where.push("a.status = 'draft'");
  if (f.status === "published") { where.push("a.status = 'published' AND a.published_at <= ?"); params.push(now); }
  if (f.status === "scheduled") { where.push("a.status = 'published' AND a.published_at > ?"); params.push(now); }
  if (f.q) { where.push("(a.title LIKE ? OR a.perex LIKE ?)"); params.push(`%${f.q}%`, `%${f.q}%`); }
  if (f.categoryId) { where.push("a.category_id = ?"); params.push(f.categoryId); }
  const sql = `${BASE_SELECT} ${where.length ? "WHERE " + where.join(" AND ") : ""} ORDER BY a.updated_at DESC LIMIT 500`;
  return attachTags(getDb().prepare(sql).all(...params) as Omit<Article, "tags">[]);
}

export function adminStats() {
  const db = getDb();
  const now = nowIso();
  const one = (sql: string, ...p: unknown[]) => (db.prepare(sql).get(...p) as { c: number }).c;
  return {
    published: one("SELECT COUNT(*) c FROM articles WHERE status='published' AND published_at <= ?", now),
    drafts: one("SELECT COUNT(*) c FROM articles WHERE status='draft'"),
    scheduled: one("SELECT COUNT(*) c FROM articles WHERE status='published' AND published_at > ?", now),
    views: one("SELECT COALESCE(SUM(views),0) c FROM articles"),
    categories: one("SELECT COUNT(*) c FROM categories"),
    media: one("SELECT COUNT(*) c FROM media"),
  };
}

export function topArticles(limit = 5): Article[] {
  return attachTags(getDb().prepare(`${BASE_SELECT} WHERE a.status='published' ORDER BY a.views DESC, a.published_at DESC LIMIT ?`).all(limit) as Omit<Article, "tags">[]);
}

export type ArticleInput = {
  title: string;
  slug?: string;
  perex: string;
  content: string;
  cover_image: string;
  cover_caption: string;
  category_id: number | null;
  author: string;
  status: ArticleStatus;
  featured: boolean;
  seo_title: string;
  seo_description: string;
  published_at: string | null;
  tags: string[];
};

function uniqueSlug(base: string, excludeId?: number): string {
  const db = getDb();
  let slug = base || "clanek";
  let i = 2;
  while (true) {
    const row = db.prepare("SELECT id FROM articles WHERE slug = ? AND id != ?").get(slug, excludeId ?? -1);
    if (!row) return slug;
    slug = `${base}-${i++}`;
  }
}

function syncTags(articleId: number, names: string[]) {
  const db = getDb();
  db.prepare("DELETE FROM article_tags WHERE article_id = ?").run(articleId);
  const ins = db.prepare("INSERT OR IGNORE INTO tags (name, slug) VALUES (?, ?)");
  const get = db.prepare("SELECT id FROM tags WHERE slug = ?");
  const link = db.prepare("INSERT OR IGNORE INTO article_tags (article_id, tag_id) VALUES (?, ?)");
  for (const raw of names) {
    const name = raw.trim();
    if (!name) continue;
    const slug = slugify(name);
    if (!slug) continue;
    ins.run(name, slug);
    const t = get.get(slug) as { id: number };
    link.run(articleId, t.id);
  }
  db.prepare("DELETE FROM tags WHERE id NOT IN (SELECT tag_id FROM article_tags)").run();
}

export function createArticle(input: ArticleInput): number {
  const db = getDb();
  const slug = uniqueSlug(slugify(input.slug || input.title));
  const published_at = input.status === "published" ? input.published_at || nowIso() : input.published_at;
  const r = db
    .prepare(`INSERT INTO articles (title, slug, perex, content, cover_image, cover_caption, category_id, author, status, featured, seo_title, seo_description, published_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(input.title, slug, input.perex, input.content, input.cover_image, input.cover_caption, input.category_id, input.author, input.status, input.featured ? 1 : 0, input.seo_title, input.seo_description, published_at);
  const id = Number(r.lastInsertRowid);
  syncTags(id, input.tags);
  if (input.featured) db.prepare("UPDATE articles SET featured = 0 WHERE id != ?").run(id);
  return id;
}

export function updateArticle(id: number, input: ArticleInput) {
  const db = getDb();
  const slug = uniqueSlug(slugify(input.slug || input.title), id);
  const published_at = input.status === "published" ? input.published_at || nowIso() : input.published_at;
  db.prepare(`UPDATE articles SET title=?, slug=?, perex=?, content=?, cover_image=?, cover_caption=?, category_id=?, author=?, status=?, featured=?, seo_title=?, seo_description=?, published_at=?, updated_at=? WHERE id=?`)
    .run(input.title, slug, input.perex, input.content, input.cover_image, input.cover_caption, input.category_id, input.author, input.status, input.featured ? 1 : 0, input.seo_title, input.seo_description, published_at, nowIso(), id);
  syncTags(id, input.tags);
  if (input.featured) db.prepare("UPDATE articles SET featured = 0 WHERE id != ?").run(id);
}

export function deleteArticle(id: number) {
  getDb().prepare("DELETE FROM articles WHERE id = ?").run(id);
}

export function setStatus(id: number, status: ArticleStatus) {
  const db = getDb();
  if (status === "published") {
    db.prepare("UPDATE articles SET status='published', published_at = COALESCE(published_at, ?), updated_at=? WHERE id=?").run(nowIso(), nowIso(), id);
  } else {
    db.prepare("UPDATE articles SET status='draft', updated_at=? WHERE id=?").run(nowIso(), id);
  }
}

export function duplicateArticle(id: number): number | null {
  const a = getById(id);
  if (!a) return null;
  return createArticle({
    title: `${a.title} (kopie)`, slug: "", perex: a.perex, content: a.content, cover_image: a.cover_image, cover_caption: a.cover_caption,
    category_id: a.category_id, author: a.author, status: "draft", featured: false, seo_title: a.seo_title, seo_description: a.seo_description,
    published_at: null, tags: a.tags.map((t) => t.name),
  });
}

/* ---------- Rubriky ---------- */

export function listCategories(): Category[] {
  return getDb()
    .prepare(`SELECT c.*, (SELECT COUNT(*) FROM articles a WHERE a.category_id = c.id AND a.status='published' AND a.published_at <= ?) AS article_count FROM categories c ORDER BY c.position, c.name`)
    .all(nowIso()) as Category[];
}

export function getCategoryBySlug(slug: string): Category | null {
  return (getDb().prepare("SELECT * FROM categories WHERE slug = ?").get(slug) as Category | undefined) ?? null;
}

export function createCategory(name: string, description: string) {
  const db = getDb();
  const base = slugify(name) || "rubrika";
  let slug = base; let i = 2;
  while (db.prepare("SELECT id FROM categories WHERE slug = ?").get(slug)) slug = `${base}-${i++}`;
  const pos = (db.prepare("SELECT COALESCE(MAX(position),0)+1 AS p FROM categories").get() as { p: number }).p;
  db.prepare("INSERT INTO categories (name, slug, description, position) VALUES (?, ?, ?, ?)").run(name, slug, description, pos);
}

export function updateCategory(id: number, name: string, slug: string, description: string) {
  const db = getDb();
  const s = slugify(slug || name) || "rubrika";
  db.prepare("UPDATE categories SET name=?, slug=?, description=? WHERE id=?").run(name, s, description, id);
}

export function deleteCategory(id: number) {
  getDb().prepare("DELETE FROM categories WHERE id = ?").run(id);
}

export function moveCategory(id: number, dir: -1 | 1) {
  const db = getDb();
  const cats = listCategories();
  const idx = cats.findIndex((c) => c.id === id);
  const swap = idx + dir;
  if (idx < 0 || swap < 0 || swap >= cats.length) return;
  const upd = db.prepare("UPDATE categories SET position=? WHERE id=?");
  const tx = db.transaction(() => {
    cats.forEach((c, i) => upd.run(i + 1, c.id));
    upd.run(swap + 1, cats[idx].id);
    upd.run(idx + 1, cats[swap].id);
  });
  tx();
}

export function getTagBySlug(slug: string): Tag | null {
  return (getDb().prepare("SELECT * FROM tags WHERE slug = ?").get(slug) as Tag | undefined) ?? null;
}

export function allTags(): (Tag & { count: number })[] {
  return getDb().prepare("SELECT t.*, (SELECT COUNT(*) FROM article_tags at WHERE at.tag_id = t.id) AS count FROM tags t ORDER BY count DESC, t.name").all() as (Tag & { count: number })[];
}

/* ---------- Média ---------- */

export type Media = { id: number; filename: string; original_name: string; mime: string; size: number; alt: string; created_at: string };

export function listMedia(): Media[] {
  return getDb().prepare("SELECT * FROM media ORDER BY created_at DESC").all() as Media[];
}
export function addMedia(m: Omit<Media, "id" | "created_at">) {
  getDb().prepare("INSERT INTO media (filename, original_name, mime, size, alt) VALUES (?, ?, ?, ?, ?)").run(m.filename, m.original_name, m.mime, m.size, m.alt);
}
export function getMedia(id: number): Media | null {
  return (getDb().prepare("SELECT * FROM media WHERE id = ?").get(id) as Media | undefined) ?? null;
}
export function deleteMedia(id: number) {
  getDb().prepare("DELETE FROM media WHERE id = ?").run(id);
}
export function updateMediaAlt(id: number, alt: string) {
  getDb().prepare("UPDATE media SET alt = ? WHERE id = ?").run(alt, id);
}
