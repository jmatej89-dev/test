import "server-only";
import { prisma } from "@/lib/db";

export const MAX_FAILED_ATTEMPTS = 5;
export const LOCKOUT_MINUTES = 15;
const IP_WINDOW_MINUTES = 15;
const IP_MAX_ATTEMPTS = 30; // guards against credential-stuffing across many codes from one IP

export function isLocked(entity: {
  lockedUntil: Date | null;
}): boolean {
  return !!entity.lockedUntil && entity.lockedUntil.getTime() > Date.now();
}

export async function recordLoginAttempt(
  actorType: "box" | "admin",
  actorCode: string,
  ip: string,
  success: boolean,
): Promise<void> {
  await prisma.loginAttempt.create({
    data: { actorType, actorCode, ip, success },
  });
}

/** True if this IP has made too many login attempts recently, across any account. */
export async function isIpRateLimited(ip: string): Promise<boolean> {
  const since = new Date(Date.now() - IP_WINDOW_MINUTES * 60 * 1000);
  const count = await prisma.loginAttempt.count({
    where: { ip, createdAt: { gte: since } },
  });
  return count >= IP_MAX_ATTEMPTS;
}

function lockoutExpiry(): Date {
  return new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000);
}

export async function registerBoxFailure(boxId: string): Promise<void> {
  const box = await prisma.box.update({
    where: { id: boxId },
    data: { failedLoginCount: { increment: 1 } },
  });
  if (box.failedLoginCount >= MAX_FAILED_ATTEMPTS) {
    await prisma.box.update({
      where: { id: boxId },
      data: { lockedUntil: lockoutExpiry() },
    });
  }
}

export async function resetBoxFailures(boxId: string): Promise<void> {
  await prisma.box.update({
    where: { id: boxId },
    data: { failedLoginCount: 0, lockedUntil: null, lastLoginAt: new Date() },
  });
}

export async function registerAdminFailure(adminId: string): Promise<void> {
  const admin = await prisma.adminUser.update({
    where: { id: adminId },
    data: { failedLoginCount: { increment: 1 } },
  });
  if (admin.failedLoginCount >= MAX_FAILED_ATTEMPTS) {
    await prisma.adminUser.update({
      where: { id: adminId },
      data: { lockedUntil: lockoutExpiry() },
    });
  }
}

export async function resetAdminFailures(adminId: string): Promise<void> {
  await prisma.adminUser.update({
    where: { id: adminId },
    data: {
      failedLoginCount: 0,
      lockedUntil: null,
      lastLoginAt: new Date(),
    },
  });
}
