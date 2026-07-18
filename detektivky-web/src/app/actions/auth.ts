"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { verifySecret, DUMMY_HASH } from "@/lib/auth";
import { createSession, destroySession, getSession } from "@/lib/session";
import {
  isIpRateLimited,
  isLocked,
  recordLoginAttempt,
  registerBoxFailure,
  registerAdminFailure,
  resetBoxFailures,
  resetAdminFailures,
} from "@/lib/rateLimit";
import { logAudit } from "@/lib/audit";
import { boxLoginSchema, adminLoginSchema } from "@/lib/validation";

export type AuthFormState = { error?: string } | undefined;

const GENERIC_LOGIN_ERROR = "Neplatný přístupový kód nebo heslo.";
const RATE_LIMIT_ERROR =
  "Příliš mnoho pokusů o přihlášení. Zkuste to prosím za chvíli.";
const LOCKED_ERROR =
  "Tento účet je dočasně uzamčen kvůli opakovaným neúspěšným pokusům. Zkuste to za 15 minut.";

async function clientIp(): Promise<string> {
  const h = await headers();
  const fwd = h.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return h.get("x-real-ip") ?? "unknown";
}

export async function boxLogin(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = boxLoginSchema.safeParse({
    code: formData.get("code"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: "Vyplňte prosím přístupový kód i heslo." };
  }
  const { code, password } = parsed.data;
  const ip = await clientIp();

  if (await isIpRateLimited(ip)) {
    return { error: RATE_LIMIT_ERROR };
  }

  const box = await prisma.box.findUnique({
    where: { code },
    include: { case: true },
  });

  if (!box) {
    await verifySecret(password, DUMMY_HASH);
    await recordLoginAttempt("box", code, ip, false);
    return { error: GENERIC_LOGIN_ERROR };
  }

  if (isLocked(box)) {
    await recordLoginAttempt("box", code, ip, false);
    return { error: LOCKED_ERROR };
  }

  const valid = await verifySecret(password, box.passwordHash);

  if (!valid) {
    await registerBoxFailure(box.id);
    await recordLoginAttempt("box", code, ip, false);
    await logAudit("box", box.id, "login_failed", undefined, ip);
    return { error: GENERIC_LOGIN_ERROR };
  }

  if (box.status !== "ACTIVE" || !box.case.isPublished) {
    await recordLoginAttempt("box", code, ip, false);
    await logAudit("box", box.id, "login_blocked_inactive", undefined, ip);
    return { error: GENERIC_LOGIN_ERROR };
  }

  await resetBoxFailures(box.id);
  await recordLoginAttempt("box", code, ip, true);
  await logAudit("box", box.id, "login_success", undefined, ip);
  await createSession({
    type: "box",
    boxId: box.id,
    caseId: box.caseId,
    boxCode: box.code,
  });

  redirect("/portal");
}

export async function adminLogin(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = adminLoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: "Zadejte platný e-mail a heslo." };
  }
  const { email, password } = parsed.data;
  const ip = await clientIp();

  if (await isIpRateLimited(ip)) {
    return { error: RATE_LIMIT_ERROR };
  }

  const admin = await prisma.adminUser.findUnique({ where: { email } });

  if (!admin) {
    await verifySecret(password, DUMMY_HASH);
    await recordLoginAttempt("admin", email, ip, false);
    return { error: GENERIC_LOGIN_ERROR };
  }

  if (isLocked(admin)) {
    await recordLoginAttempt("admin", email, ip, false);
    return { error: LOCKED_ERROR };
  }

  const valid = await verifySecret(password, admin.passwordHash);

  if (!valid) {
    await registerAdminFailure(admin.id);
    await recordLoginAttempt("admin", email, ip, false);
    await logAudit("admin", admin.id, "login_failed", undefined, ip);
    return { error: GENERIC_LOGIN_ERROR };
  }

  await resetAdminFailures(admin.id);
  await recordLoginAttempt("admin", email, ip, true);
  await logAudit("admin", admin.id, "login_success", undefined, ip);
  await createSession({
    type: "admin",
    adminId: admin.id,
    email: admin.email,
    role: admin.role,
  });

  redirect("/admin");
}

export async function logout(): Promise<void> {
  const session = await getSession();
  await destroySession();
  redirect(session?.type === "admin" ? "/admin/prihlaseni" : "/prihlaseni");
}
