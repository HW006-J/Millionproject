import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockFindUnique, mockUpdate, mockVerifyPassword } = vi.hoisted(() => ({
  mockFindUnique: vi.fn(),
  mockUpdate: vi.fn(),
  mockVerifyPassword: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: { adminUser: { findUnique: mockFindUnique, update: mockUpdate } },
}));

vi.mock("@/lib/admin/password", () => ({
  verifyPassword: mockVerifyPassword,
}));

const { attemptAdminLogin, MAX_FAILED_LOGIN_ATTEMPTS } = await import("@/lib/admin/login");

beforeEach(() => {
  mockFindUnique.mockReset();
  mockUpdate.mockReset();
  mockVerifyPassword.mockReset();
});

function adminRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "admin_1",
    email: "admin@example.com",
    passwordHash: "hashed",
    failedLoginAttempts: 0,
    lockedUntil: null,
    ...overrides,
  };
}

describe("attemptAdminLogin", () => {
  it("succeeds with the correct password and resets the failure counters", async () => {
    mockFindUnique.mockResolvedValue(adminRow({ failedLoginAttempts: 2 }));
    mockVerifyPassword.mockResolvedValue(true);
    mockUpdate.mockResolvedValue({});

    const result = await attemptAdminLogin("admin@example.com", "correct-password");

    expect(result).toEqual({ status: "success", adminId: "admin_1" });
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "admin_1" },
      data: { failedLoginAttempts: 0, lockedUntil: null, lastLoginAt: expect.any(Date) },
    });
  });

  it("returns invalid_credentials for an unknown email without revealing that", async () => {
    mockFindUnique.mockResolvedValue(null);
    mockVerifyPassword.mockResolvedValue(false);

    const result = await attemptAdminLogin("nobody@example.com", "whatever");

    expect(result).toEqual({ status: "invalid_credentials" });
    // Still calls verifyPassword against a decoy hash, to keep timing similar.
    expect(mockVerifyPassword).toHaveBeenCalledWith("whatever", expect.any(String));
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("returns invalid_credentials for a wrong password and increments the counter atomically", async () => {
    mockFindUnique.mockResolvedValue(adminRow({ failedLoginAttempts: 1 }));
    mockVerifyPassword.mockResolvedValue(false);
    mockUpdate.mockResolvedValue({ failedLoginAttempts: 2 });

    const result = await attemptAdminLogin("admin@example.com", "wrong-password");

    expect(result).toEqual({ status: "invalid_credentials" });
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "admin_1" },
      data: { failedLoginAttempts: { increment: 1 } },
    });
  });

  it("locks the account once failures reach the maximum", async () => {
    mockFindUnique.mockResolvedValue(adminRow({ failedLoginAttempts: MAX_FAILED_LOGIN_ATTEMPTS - 1 }));
    mockVerifyPassword.mockResolvedValue(false);
    mockUpdate
      .mockResolvedValueOnce({ failedLoginAttempts: MAX_FAILED_LOGIN_ATTEMPTS })
      .mockResolvedValueOnce({});

    await attemptAdminLogin("admin@example.com", "wrong-password");

    expect(mockUpdate).toHaveBeenCalledTimes(2);
    expect(mockUpdate).toHaveBeenNthCalledWith(2, {
      where: { id: "admin_1" },
      data: { lockedUntil: expect.any(Date) },
    });
  });

  it("rejects login while locked, without re-checking the password", async () => {
    const future = new Date(Date.now() + 60_000);
    mockFindUnique.mockResolvedValue(adminRow({ lockedUntil: future }));

    const result = await attemptAdminLogin("admin@example.com", "correct-password");

    expect(result).toEqual({ status: "locked" });
    expect(mockVerifyPassword).not.toHaveBeenCalled();
  });

  it("allows login again automatically once the lock has expired", async () => {
    const past = new Date(Date.now() - 60_000);
    mockFindUnique.mockResolvedValue(adminRow({ lockedUntil: past, failedLoginAttempts: 5 }));
    mockVerifyPassword.mockResolvedValue(true);
    mockUpdate.mockResolvedValue({});

    const result = await attemptAdminLogin("admin@example.com", "correct-password");

    expect(result).toEqual({ status: "success", adminId: "admin_1" });
  });
});
