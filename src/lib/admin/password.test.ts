import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/admin/password";

describe("hashPassword / verifyPassword", () => {
  it("produces a hash that verifies against the original password", async () => {
    const hash = await hashPassword("a-reasonably-long-test-password");
    await expect(verifyPassword("a-reasonably-long-test-password", hash)).resolves.toBe(true);
  });

  it("rejects an incorrect password", async () => {
    const hash = await hashPassword("a-reasonably-long-test-password");
    await expect(verifyPassword("a-different-password", hash)).resolves.toBe(false);
  });

  it("never stores the plaintext password in the hash", async () => {
    const password = "a-reasonably-long-test-password";
    const hash = await hashPassword(password);
    expect(hash).not.toContain(password);
  });

  it("produces different hashes for the same password (random salt)", async () => {
    const hashA = await hashPassword("same-password");
    const hashB = await hashPassword("same-password");
    expect(hashA).not.toBe(hashB);
  });
});
