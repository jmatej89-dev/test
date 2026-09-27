"use server";

import { revalidatePath } from "next/cache";
import { addSubscriber, removeSubscriber } from "@/lib/newsletter";
import { requireAdmin } from "@/lib/auth";

export type SubscribeState = { ok?: boolean; error?: string } | undefined;

export async function subscribeAction(_prev: SubscribeState, formData: FormData): Promise<SubscribeState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return { error: "Zadejte platný e-mail." };
  addSubscriber(email);
  return { ok: true };
}

export async function removeSubscriberAction(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (id) removeSubscriber(id);
  revalidatePath("/admin/odberatele");
}
