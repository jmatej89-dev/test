"use server";

import { getAuthorizedAdmin } from "@/lib/dal";
import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import {
  personSchema,
  updatePersonSchema,
  documentSchema,
  updateDocumentSchema,
  wiretapSchema,
  updateWiretapSchema,
  emailSchema,
  updateEmailSchema,
} from "@/lib/validation";

export type ContentFormState = { error?: string; ok?: boolean } | undefined;

function str(formData: FormData, key: string): string | undefined {
  const v = formData.get(key);
  return typeof v === "string" && v.trim() !== "" ? v : undefined;
}

async function assertCaseExists(caseId: string) {
  const record = await prisma.case.findUnique({ where: { id: caseId } });
  if (!record) throw new Error("Případ nenalezen.");
  return record;
}

// ---- Person -----------------------------------------------------------

export async function createPerson(
  _prevState: ContentFormState,
  formData: FormData,
): Promise<ContentFormState> {
  const admin = await getAuthorizedAdmin();
  const caseId = String(formData.get("caseId") ?? "");
  await assertCaseExists(caseId);

  const parsed = personSchema.safeParse({
    caseId,
    name: formData.get("name"),
    role: formData.get("role"),
    occupation: str(formData, "occupation"),
    bio: formData.get("bio"),
    photoUrl: str(formData, "photoUrl"),
    isCulprit: formData.get("isCulprit") === "on",
    sortOrder: formData.get("sortOrder") || 0,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Neplatná data." };
  }

  const created = await prisma.person.create({ data: parsed.data });
  await logAudit("admin", admin.id, "person_created", { personId: created.id });
  revalidatePath(`/admin/pripady/${caseId}`);
  return { ok: true };
}

export async function updatePerson(
  _prevState: ContentFormState,
  formData: FormData,
): Promise<ContentFormState> {
  const admin = await getAuthorizedAdmin();
  const caseId = String(formData.get("caseId") ?? "");
  await assertCaseExists(caseId);

  const parsed = updatePersonSchema.safeParse({
    personId: formData.get("personId"),
    caseId,
    name: formData.get("name"),
    role: formData.get("role"),
    occupation: str(formData, "occupation"),
    bio: formData.get("bio"),
    photoUrl: str(formData, "photoUrl"),
    isCulprit: formData.get("isCulprit") === "on",
    sortOrder: formData.get("sortOrder") || 0,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Neplatná data." };
  }
  const { personId, ...data } = parsed.data;

  await prisma.person.update({ where: { id: personId }, data });
  await logAudit("admin", admin.id, "person_updated", { personId });
  revalidatePath(`/admin/pripady/${caseId}`);
  return { ok: true };
}

export async function deletePerson(caseId: string, personId: string): Promise<void> {
  const admin = await getAuthorizedAdmin();
  await prisma.person.delete({ where: { id: personId } });
  await logAudit("admin", admin.id, "person_deleted", { personId });
  revalidatePath(`/admin/pripady/${caseId}`);
}

// ---- Document -----------------------------------------------------------

export async function createDocument(
  _prevState: ContentFormState,
  formData: FormData,
): Promise<ContentFormState> {
  const admin = await getAuthorizedAdmin();
  const caseId = String(formData.get("caseId") ?? "");
  await assertCaseExists(caseId);

  const parsed = documentSchema.safeParse({
    caseId,
    title: formData.get("title"),
    type: formData.get("type"),
    url: str(formData, "url"),
    content: str(formData, "content"),
    description: str(formData, "description"),
    sortOrder: formData.get("sortOrder") || 0,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Neplatná data." };
  }

  const created = await prisma.document.create({ data: parsed.data });
  await logAudit("admin", admin.id, "document_created", { documentId: created.id });
  revalidatePath(`/admin/pripady/${caseId}`);
  return { ok: true };
}

export async function updateDocument(
  _prevState: ContentFormState,
  formData: FormData,
): Promise<ContentFormState> {
  const admin = await getAuthorizedAdmin();
  const caseId = String(formData.get("caseId") ?? "");
  await assertCaseExists(caseId);

  const parsed = updateDocumentSchema.safeParse({
    documentId: formData.get("documentId"),
    caseId,
    title: formData.get("title"),
    type: formData.get("type"),
    url: str(formData, "url"),
    content: str(formData, "content"),
    description: str(formData, "description"),
    sortOrder: formData.get("sortOrder") || 0,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Neplatná data." };
  }
  const { documentId, ...data } = parsed.data;

  await prisma.document.update({ where: { id: documentId }, data });
  await logAudit("admin", admin.id, "document_updated", { documentId });
  revalidatePath(`/admin/pripady/${caseId}`);
  return { ok: true };
}

export async function deleteDocument(caseId: string, documentId: string): Promise<void> {
  const admin = await getAuthorizedAdmin();
  await prisma.document.delete({ where: { id: documentId } });
  await logAudit("admin", admin.id, "document_deleted", { documentId });
  revalidatePath(`/admin/pripady/${caseId}`);
}

// ---- Wiretap -----------------------------------------------------------

export async function createWiretap(
  _prevState: ContentFormState,
  formData: FormData,
): Promise<ContentFormState> {
  const admin = await getAuthorizedAdmin();
  const caseId = String(formData.get("caseId") ?? "");
  await assertCaseExists(caseId);

  const parsed = wiretapSchema.safeParse({
    caseId,
    title: formData.get("title"),
    audioUrl: formData.get("audioUrl"),
    transcript: str(formData, "transcript"),
    participants: str(formData, "participants"),
    dateLabel: str(formData, "dateLabel"),
    sortOrder: formData.get("sortOrder") || 0,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Neplatná data." };
  }

  const created = await prisma.wiretap.create({ data: parsed.data });
  await logAudit("admin", admin.id, "wiretap_created", { wiretapId: created.id });
  revalidatePath(`/admin/pripady/${caseId}`);
  return { ok: true };
}

export async function updateWiretap(
  _prevState: ContentFormState,
  formData: FormData,
): Promise<ContentFormState> {
  const admin = await getAuthorizedAdmin();
  const caseId = String(formData.get("caseId") ?? "");
  await assertCaseExists(caseId);

  const parsed = updateWiretapSchema.safeParse({
    wiretapId: formData.get("wiretapId"),
    caseId,
    title: formData.get("title"),
    audioUrl: formData.get("audioUrl"),
    transcript: str(formData, "transcript"),
    participants: str(formData, "participants"),
    dateLabel: str(formData, "dateLabel"),
    sortOrder: formData.get("sortOrder") || 0,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Neplatná data." };
  }
  const { wiretapId, ...data } = parsed.data;

  await prisma.wiretap.update({ where: { id: wiretapId }, data });
  await logAudit("admin", admin.id, "wiretap_updated", { wiretapId });
  revalidatePath(`/admin/pripady/${caseId}`);
  return { ok: true };
}

export async function deleteWiretap(caseId: string, wiretapId: string): Promise<void> {
  const admin = await getAuthorizedAdmin();
  await prisma.wiretap.delete({ where: { id: wiretapId } });
  await logAudit("admin", admin.id, "wiretap_deleted", { wiretapId });
  revalidatePath(`/admin/pripady/${caseId}`);
}

// ---- Email -----------------------------------------------------------

export async function createEmail(
  _prevState: ContentFormState,
  formData: FormData,
): Promise<ContentFormState> {
  const admin = await getAuthorizedAdmin();
  const caseId = String(formData.get("caseId") ?? "");
  await assertCaseExists(caseId);

  const parsed = emailSchema.safeParse({
    caseId,
    fromPersonId: str(formData, "fromPersonId"),
    toPersonId: str(formData, "toPersonId"),
    subject: formData.get("subject"),
    body: formData.get("body"),
    dateLabel: str(formData, "dateLabel"),
    sortOrder: formData.get("sortOrder") || 0,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Neplatná data." };
  }

  const created = await prisma.email.create({ data: parsed.data });
  await logAudit("admin", admin.id, "email_created", { emailId: created.id });
  revalidatePath(`/admin/pripady/${caseId}`);
  return { ok: true };
}

export async function updateEmail(
  _prevState: ContentFormState,
  formData: FormData,
): Promise<ContentFormState> {
  const admin = await getAuthorizedAdmin();
  const caseId = String(formData.get("caseId") ?? "");
  await assertCaseExists(caseId);

  const parsed = updateEmailSchema.safeParse({
    emailId: formData.get("emailId"),
    caseId,
    fromPersonId: str(formData, "fromPersonId"),
    toPersonId: str(formData, "toPersonId"),
    subject: formData.get("subject"),
    body: formData.get("body"),
    dateLabel: str(formData, "dateLabel"),
    sortOrder: formData.get("sortOrder") || 0,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Neplatná data." };
  }
  const { emailId, ...data } = parsed.data;

  await prisma.email.update({ where: { id: emailId }, data });
  await logAudit("admin", admin.id, "email_updated", { emailId });
  revalidatePath(`/admin/pripady/${caseId}`);
  return { ok: true };
}

export async function deleteEmail(caseId: string, emailId: string): Promise<void> {
  const admin = await getAuthorizedAdmin();
  await prisma.email.delete({ where: { id: emailId } });
  await logAudit("admin", admin.id, "email_deleted", { emailId });
  revalidatePath(`/admin/pripady/${caseId}`);
}
