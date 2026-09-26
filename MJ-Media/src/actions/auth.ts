"use server";

import { redirect } from "next/navigation";
import { checkPassword, clearSessionCookie, setSessionCookie } from "@/lib/auth";

export async function loginAction(_prev: { error?: string } | undefined, formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/admin");
  if (!checkPassword(password)) {
    return { error: "Nesprávné heslo." };
  }
  await setSessionCookie();
  redirect(next.startsWith("/admin") ? next : "/admin");
}

export async function logoutAction() {
  await clearSessionCookie();
  redirect("/prihlaseni");
}
