"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createCategory, deleteCategory, moveCategory, updateCategory } from "@/lib/articles";

export async function createCategoryAction(formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  createCategory(name, String(formData.get("description") ?? "").trim());
  revalidatePath("/", "layout");
}

export async function updateCategoryAction(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const name = String(formData.get("name") ?? "").trim();
  if (!id || !name) return;
  updateCategory(id, name, String(formData.get("slug") ?? ""), String(formData.get("description") ?? "").trim());
  revalidatePath("/", "layout");
}

export async function deleteCategoryAction(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (id) deleteCategory(id);
  revalidatePath("/", "layout");
}

export async function moveCategoryAction(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const dir = String(formData.get("dir")) === "up" ? -1 : 1;
  if (id) moveCategory(id, dir);
  revalidatePath("/", "layout");
}
