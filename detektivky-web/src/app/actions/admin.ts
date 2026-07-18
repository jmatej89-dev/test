"use server";

import { getAuthorizedAdmin } from "@/lib/dal";
import { prisma } from "@/lib/db";
import { generateBoxCode, generateBoxPassword, hashSecret } from "@/lib/auth";
import {
  createCaseSchema,
  updateCaseSchema,
  createBoxSchema,
} from "@/lib/validation";
import { logAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";

export type CreateCaseFormState = { error?: string } | undefined;

export async function createCase(
  _prevState: CreateCaseFormState,
  formData: FormData,
): Promise<CreateCaseFormState> {
  const admin = await getAuthorizedAdmin();

  const parsed = createCaseSchema.safeParse({
    slug: formData.get("slug"),
    title: formData.get("title"),
    subtitle: formData.get("subtitle") || undefined,
    description: formData.get("description"),
    difficulty: formData.get("difficulty"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Neplatná data." };
  }

  const existing = await prisma.case.findUnique({
    where: { slug: parsed.data.slug },
  });
  if (existing) {
    return { error: "Případ s tímto slugem už existuje." };
  }

  const created = await prisma.case.create({ data: parsed.data });
  await logAudit("admin", admin.id, "case_created", { caseId: created.id });
  revalidatePath("/admin");

  return undefined;
}

export type UpdateCaseFormState = { error?: string; ok?: boolean } | undefined;

export async function updateCase(
  _prevState: UpdateCaseFormState,
  formData: FormData,
): Promise<UpdateCaseFormState> {
  const admin = await getAuthorizedAdmin();

  const parsed = updateCaseSchema.safeParse({
    caseId: formData.get("caseId"),
    title: formData.get("title"),
    subtitle: formData.get("subtitle") || undefined,
    description: formData.get("description"),
    difficulty: formData.get("difficulty"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Neplatná data." };
  }

  const { caseId, ...data } = parsed.data;
  const existing = await prisma.case.findUnique({ where: { id: caseId } });
  if (!existing) return { error: "Případ nenalezen." };

  await prisma.case.update({ where: { id: caseId }, data });
  await logAudit("admin", admin.id, "case_updated", { caseId });
  revalidatePath(`/admin/pripady/${caseId}`);

  return { ok: true };
}

export async function togglePublishCase(caseId: string): Promise<void> {
  const admin = await getAuthorizedAdmin();
  const record = await prisma.case.findUnique({ where: { id: caseId } });
  if (!record) return;

  await prisma.case.update({
    where: { id: caseId },
    data: { isPublished: !record.isPublished },
  });
  await logAudit("admin", admin.id, "case_publish_toggled", {
    caseId,
    isPublished: !record.isPublished,
  });
  revalidatePath("/admin");
  revalidatePath(`/admin/pripady/${caseId}`);
}

export type CreateBoxFormState =
  | { error: string }
  | { credentials: { code: string; password: string } }
  | undefined;

export async function createBox(
  _prevState: CreateBoxFormState,
  formData: FormData,
): Promise<CreateBoxFormState> {
  const admin = await getAuthorizedAdmin();

  const parsed = createBoxSchema.safeParse({
    caseId: formData.get("caseId"),
    customerLabel: formData.get("customerLabel") || undefined,
  });
  if (!parsed.success) {
    return { error: "Vyberte případ." };
  }

  const caseRecord = await prisma.case.findUnique({
    where: { id: parsed.data.caseId },
  });
  if (!caseRecord) {
    return { error: "Neplatný případ." };
  }

  const password = generateBoxPassword();
  const passwordHash = await hashSecret(password);

  // Extremely unlikely to collide, but retry on the off chance the random
  // code already exists rather than surfacing a raw DB error.
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateBoxCode();
    try {
      const box = await prisma.box.create({
        data: {
          code,
          passwordHash,
          caseId: parsed.data.caseId,
          customerLabel: parsed.data.customerLabel,
        },
      });
      await logAudit("admin", admin.id, "box_created", { boxId: box.id });
      revalidatePath("/admin");
      return { credentials: { code, password } };
    } catch (err: unknown) {
      const isUniqueViolation =
        typeof err === "object" &&
        err !== null &&
        "code" in err &&
        (err as { code?: string }).code === "P2002";
      if (!isUniqueViolation) throw err;
    }
  }

  return { error: "Nepodařilo se vygenerovat unikátní kód, zkuste to znovu." };
}

export async function revokeBox(boxId: string): Promise<void> {
  const admin = await getAuthorizedAdmin();
  await prisma.box.update({ where: { id: boxId }, data: { status: "REVOKED" } });
  await logAudit("admin", admin.id, "box_revoked", { boxId });
  revalidatePath("/admin");
}

export async function reactivateBox(boxId: string): Promise<void> {
  const admin = await getAuthorizedAdmin();
  await prisma.box.update({
    where: { id: boxId },
    data: { status: "ACTIVE", failedLoginCount: 0, lockedUntil: null },
  });
  await logAudit("admin", admin.id, "box_reactivated", { boxId });
  revalidatePath("/admin");
}

export async function resetBoxPassword(
  boxId: string,
): Promise<{ password: string } | { error: string }> {
  const admin = await getAuthorizedAdmin();
  const password = generateBoxPassword();
  const passwordHash = await hashSecret(password);

  await prisma.box.update({
    where: { id: boxId },
    data: {
      passwordHash,
      failedLoginCount: 0,
      lockedUntil: null,
    },
  });
  await logAudit("admin", admin.id, "box_password_reset", { boxId });
  revalidatePath("/admin");

  return { password };
}
