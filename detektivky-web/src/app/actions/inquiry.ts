"use server";

import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { orderInquirySchema } from "@/lib/validation";

export type OrderInquiryFormState = { error?: string; ok?: boolean } | undefined;

async function clientIp(): Promise<string> {
  const h = await headers();
  const fwd = h.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return h.get("x-real-ip") ?? "unknown";
}

export async function submitOrderInquiry(
  _prevState: OrderInquiryFormState,
  formData: FormData,
): Promise<OrderInquiryFormState> {
  const parsed = orderInquirySchema.safeParse({
    caseId: formData.get("caseId"),
    name: formData.get("name"),
    email: formData.get("email"),
    message: formData.get("message") || undefined,
    website: formData.get("website") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Zkontrolujte prosím formulář." };
  }

  // Honeypot tripped — silently pretend success so bots don't learn.
  if (parsed.data.website) {
    return { ok: true };
  }

  const caseRecord = await prisma.case.findUnique({
    where: { id: parsed.data.caseId },
  });
  if (!caseRecord || !caseRecord.isPublished) {
    return { error: "Tento případ momentálně není dostupný." };
  }

  const inquiry = await prisma.orderInquiry.create({
    data: {
      caseId: parsed.data.caseId,
      name: parsed.data.name,
      email: parsed.data.email,
      message: parsed.data.message,
    },
  });

  await logAudit("system", null, "order_inquiry_submitted", { inquiryId: inquiry.id }, await clientIp());

  return { ok: true };
}
