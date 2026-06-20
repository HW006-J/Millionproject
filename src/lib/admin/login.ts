import { prisma } from "@/lib/prisma";
import { verifyPassword } from "./password";

export const MAX_FAILED_LOGIN_ATTEMPTS = 5;
export const LOCKOUT_DURATION_MS = 15 * 60 * 1000;

// A fixed decoy bcrypt hash (of an arbitrary, non-secret string) — never a
// real credential. Comparing against it when an email is unknown keeps the
// response time similar to a real password check, reducing the ability to
// enumerate which emails have accounts via response timing.
const DECOY_PASSWORD_HASH = "$2b$12$F5aomHgAr7xUBuViOEzyR.vsXITXoJjDLHEuFUJzPbmanbyGEbHDS";

export type LoginAttemptResult =
  | { status: "success"; adminId: string }
  | { status: "invalid_credentials" }
  | { status: "locked" };

/**
 * Attempts an admin login with durable, database-backed lockout. The
 * caller (the login Server Action) must collapse every non-"success"
 * result into the same generic, user-facing message — this function's
 * distinct internal statuses exist only for our own clarity, never for
 * the response shown to the client.
 */
export async function attemptAdminLogin(
  email: string,
  password: string,
): Promise<LoginAttemptResult> {
  const admin = await prisma.adminUser.findUnique({ where: { email } });

  if (!admin) {
    await verifyPassword(password, DECOY_PASSWORD_HASH);
    return { status: "invalid_credentials" };
  }

  const now = new Date();

  if (admin.lockedUntil && admin.lockedUntil > now) {
    return { status: "locked" };
  }

  const passwordValid = await verifyPassword(password, admin.passwordHash);

  if (!passwordValid) {
    // Atomic, database-level increment — never a JS-side read-modify-write
    // — so concurrent failed attempts against the same account can't be
    // lost to a race and silently bypass the counter.
    const updated = await prisma.adminUser.update({
      where: { id: admin.id },
      data: { failedLoginAttempts: { increment: 1 } },
    });

    if (updated.failedLoginAttempts >= MAX_FAILED_LOGIN_ATTEMPTS) {
      await prisma.adminUser.update({
        where: { id: admin.id },
        data: { lockedUntil: new Date(Date.now() + LOCKOUT_DURATION_MS) },
      });
    }

    return { status: "invalid_credentials" };
  }

  await prisma.adminUser.update({
    where: { id: admin.id },
    data: { failedLoginAttempts: 0, lockedUntil: null, lastLoginAt: now },
  });

  return { status: "success", adminId: admin.id };
}
