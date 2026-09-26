"use server";

import fs from "node:fs/promises";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { deleteMedia, getMedia, updateMediaAlt } from "@/lib/articles";

export async function deleteMediaAction(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const m = id ? getMedia(id) : null;
  if (!m) return;
  deleteMedia(id);
  try { await fs.unlink(path.join(process.cwd(), "data", "uploads", m.filename)); } catch {}
  revalidatePath("/admin/media");
}

export async function updateMediaAltAction(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (!id) return;
  updateMediaAlt(id, String(formData.get("alt") ?? "").trim());
  revalidatePath("/admin/media");
}
