"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createArticle, deleteArticle, duplicateArticle, setStatus, updateArticle, type ArticleInput } from "@/lib/articles";

export type SaveState = { error?: string; ok?: boolean; id?: number; slug?: string; savedAt?: string } | undefined;

function parse(formData: FormData): { input?: ArticleInput; error?: string } {
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return { error: "Titulek je povinný." };
  const statusRaw = String(formData.get("status") ?? "draft");
  const status = statusRaw === "published" ? "published" : "draft";
  const catRaw = String(formData.get("category_id") ?? "");
  const publishedRaw = String(formData.get("published_at") ?? "").trim();
  let published_at: string | null = null;
  if (publishedRaw) {
    const d = new Date(publishedRaw);
    if (Number.isNaN(d.getTime())) return { error: "Neplatné datum publikace." };
    published_at = d.toISOString();
  }
  const tags = String(formData.get("tags") ?? "").split(",").map((t) => t.trim()).filter(Boolean);
  return {
    input: {
      title,
      slug: String(formData.get("slug") ?? "").trim(),
      perex: String(formData.get("perex") ?? "").trim(),
      content: String(formData.get("content") ?? ""),
      cover_image: String(formData.get("cover_image") ?? "").trim(),
      cover_caption: String(formData.get("cover_caption") ?? "").trim(),
      category_id: catRaw ? Number(catRaw) : null,
      author: String(formData.get("author") ?? "").trim(),
      status,
      featured: formData.get("featured") === "on",
      seo_title: String(formData.get("seo_title") ?? "").trim(),
      seo_description: String(formData.get("seo_description") ?? "").trim(),
      published_at,
      tags,
    },
  };
}

function revalidateAll() {
  revalidatePath("/", "layout");
}

export async function saveArticleAction(_prev: SaveState, formData: FormData): Promise<SaveState> {
  await requireAdmin();
  const { input, error } = parse(formData);
  if (error || !input) return { error };
  const idRaw = String(formData.get("id") ?? "");
  let id: number;
  if (idRaw) {
    id = Number(idRaw);
    updateArticle(id, input);
  } else {
    id = createArticle(input);
  }
  revalidateAll();
  if (!idRaw) redirect(`/admin/clanky/${id}?ulozeno=1`);
  return { ok: true, id, savedAt: new Date().toISOString() };
}

export async function deleteArticleAction(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (id) deleteArticle(id);
  revalidateAll();
  redirect("/admin/clanky");
}

export async function setStatusAction(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const status = String(formData.get("status")) === "published" ? "published" : "draft";
  if (id) setStatus(id, status);
  revalidateAll();
}

export async function duplicateArticleAction(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const newId = id ? duplicateArticle(id) : null;
  revalidateAll();
  if (newId) redirect(`/admin/clanky/${newId}`);
}
