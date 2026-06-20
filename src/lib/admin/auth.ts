import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE_NAME, getAuthSecret, verifySessionToken } from "./session";

export interface AdminSessionUser {
  id: string;
  email: string;
}

/**
 * The centralized, server-side authorization check. This is the real
 * security boundary — every protected page, Server Action, and Route
 * Handler must call this (or requireAdmin()) independently. The Proxy's
 * cookie check is optimistic only and must never be relied on alone.
 *
 * Fails closed: a missing/weak AUTH_SECRET, a missing/invalid/expired
 * cookie, or a deleted admin account all simply result in null.
 */
export async function verifyAdminSession(): Promise<AdminSessionUser | null> {
  const secret = getAuthSecret();
  if (!secret) {
    return null;
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return null;
  }

  const verified = verifySessionToken(token, secret);
  if (!verified) {
    return null;
  }

  const admin = await prisma.adminUser.findUnique({
    where: { id: verified.adminId },
    select: { id: true, email: true },
  });

  return admin;
}

/**
 * For use in Server Components and Server Actions: returns the admin user,
 * or redirects to /admin/login if there isn't a valid, authorized session.
 */
export async function requireAdmin(): Promise<AdminSessionUser> {
  const admin = await verifyAdminSession();
  if (!admin) {
    redirect("/admin/login");
  }
  return admin;
}
