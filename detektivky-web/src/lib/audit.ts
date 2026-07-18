import "server-only";
import { prisma } from "@/lib/db";

export async function logAudit(
  actorType: "box" | "admin" | "system",
  actorId: string | null,
  action: string,
  meta?: Record<string, unknown>,
  ip?: string | null,
): Promise<void> {
  await prisma.auditLog.create({
    data: {
      actorType,
      actorId,
      action,
      meta: meta ? JSON.parse(JSON.stringify(meta)) : undefined,
      ip: ip ?? undefined,
    },
  });
}
