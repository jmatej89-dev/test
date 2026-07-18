import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";

/** Optimistic + shape check only. Real authorization re-checks the DB row below. */
export const verifyBoxSession = cache(async () => {
  const session = await getSession();
  if (!session || session.type !== "box") {
    redirect("/prihlaseni");
  }
  return session;
});

export const verifyAdminSession = cache(async () => {
  const session = await getSession();
  if (!session || session.type !== "admin") {
    redirect("/admin/prihlaseni");
  }
  return session;
});

/**
 * Re-reads the box from the database on every call (no caching of the
 * authorization decision itself) so a revoked/expired box loses portal
 * access immediately, even mid-session.
 */
export const getAuthorizedBox = cache(async () => {
  const session = await verifyBoxSession();
  const box = await prisma.box.findUnique({
    where: { id: session.boxId },
    include: { case: true },
  });

  if (!box || box.status !== "ACTIVE" || !box.case.isPublished) {
    redirect("/prihlaseni?error=access_revoked");
  }

  return box;
});

export const getAuthorizedAdmin = cache(async () => {
  const session = await verifyAdminSession();
  const admin = await prisma.adminUser.findUnique({
    where: { id: session.adminId },
  });

  if (!admin) {
    redirect("/admin/prihlaseni");
  }

  return admin;
});
