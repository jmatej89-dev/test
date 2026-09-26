"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { saveSettings, type Settings } from "@/lib/settings";

export type SettingsState = { ok?: boolean } | undefined;

export async function saveSettingsAction(_prev: SettingsState, formData: FormData): Promise<SettingsState> {
  await requireAdmin();
  const keys: (keyof Settings)[] = ["site_name", "tagline", "author_name", "about", "footer_note", "contact_email", "social_x", "social_instagram", "social_facebook"];
  const patch: Partial<Settings> = {};
  for (const k of keys) patch[k] = String(formData.get(k) ?? "").trim();
  if (!patch.site_name) patch.site_name = "MJ media";
  saveSettings(patch);
  revalidatePath("/", "layout");
  return { ok: true };
}
