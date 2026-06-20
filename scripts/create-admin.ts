import path from "node:path";
import { config as loadEnv } from "dotenv";

// Load .env first, then .env.local on top (matching Next.js's own
// precedence) so ADMIN_EMAIL / ADMIN_INITIAL_PASSWORD are picked up
// wherever they're kept locally. `quiet: true` suppresses dotenv's own
// informational/promotional console output — this script prints only its
// own concise success or failure messages, never any env-loading noise.
loadEnv({ path: path.resolve(process.cwd(), ".env"), quiet: true });
loadEnv({ path: path.resolve(process.cwd(), ".env.local"), override: true, quiet: true });

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_INITIAL_PASSWORD;

  if (!email || !password) {
    console.error(
      "ADMIN_EMAIL and ADMIN_INITIAL_PASSWORD must both be set (e.g. in .env.local) before running this script. Refusing to run.",
    );
    process.exitCode = 1;
    return;
  }

  if (password.length < 12) {
    console.error("ADMIN_INITIAL_PASSWORD is too short. Use at least 12 characters. Refusing to run.");
    process.exitCode = 1;
    return;
  }

  // Imported only after the env vars are confirmed present, so these
  // modules' own env reads (DATABASE_URL etc.) see the loaded values.
  const { hashPassword } = await import("../src/lib/admin/password");
  const { prisma } = await import("../src/lib/prisma");

  const normalizedEmail = email.trim().toLowerCase();
  const passwordHash = await hashPassword(password);

  await prisma.adminUser.upsert({
    where: { email: normalizedEmail },
    create: { email: normalizedEmail, passwordHash },
    update: { passwordHash, failedLoginAttempts: 0, lockedUntil: null },
  });

  console.log(`Admin account ready for ${normalizedEmail}.`);
  console.log(
    "Now remove ADMIN_INITIAL_PASSWORD from your env file — it is bootstrap-only and is never read by the running application.",
  );
}

main()
  .catch((error) => {
    console.error("Failed to create/update the admin account:", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => process.exit());
