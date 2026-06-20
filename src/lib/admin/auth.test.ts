import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockCookieGet,
  mockGetAuthSecret,
  mockVerifySessionToken,
  mockFindUnique,
  mockRedirect,
} = vi.hoisted(() => ({
  mockCookieGet: vi.fn(),
  mockGetAuthSecret: vi.fn(),
  mockVerifySessionToken: vi.fn(),
  mockFindUnique: vi.fn(),
  mockRedirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({ get: mockCookieGet })),
}));

vi.mock("next/navigation", () => ({
  redirect: mockRedirect,
}));

vi.mock("@/lib/admin/session", () => ({
  SESSION_COOKIE_NAME: "admin_session",
  getAuthSecret: mockGetAuthSecret,
  verifySessionToken: mockVerifySessionToken,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: { adminUser: { findUnique: mockFindUnique } },
}));

const { verifyAdminSession, requireAdmin } = await import("@/lib/admin/auth");

beforeEach(() => {
  mockCookieGet.mockReset();
  mockGetAuthSecret.mockReset();
  mockVerifySessionToken.mockReset();
  mockFindUnique.mockReset();
  mockRedirect.mockClear();
});

describe("verifyAdminSession", () => {
  it("returns null when AUTH_SECRET is missing or weak (fail closed)", async () => {
    mockGetAuthSecret.mockReturnValue(null);

    const result = await verifyAdminSession();

    expect(result).toBeNull();
    expect(mockCookieGet).not.toHaveBeenCalled();
  });

  it("returns null when there is no session cookie", async () => {
    mockGetAuthSecret.mockReturnValue("secret");
    mockCookieGet.mockReturnValue(undefined);

    const result = await verifyAdminSession();

    expect(result).toBeNull();
    expect(mockVerifySessionToken).not.toHaveBeenCalled();
  });

  it("returns null when the token fails verification", async () => {
    mockGetAuthSecret.mockReturnValue("secret");
    mockCookieGet.mockReturnValue({ value: "bad-token" });
    mockVerifySessionToken.mockReturnValue(null);

    const result = await verifyAdminSession();

    expect(result).toBeNull();
    expect(mockFindUnique).not.toHaveBeenCalled();
  });

  it("returns null when the admin account no longer exists", async () => {
    mockGetAuthSecret.mockReturnValue("secret");
    mockCookieGet.mockReturnValue({ value: "good-token" });
    mockVerifySessionToken.mockReturnValue({ adminId: "admin_1" });
    mockFindUnique.mockResolvedValue(null);

    const result = await verifyAdminSession();

    expect(result).toBeNull();
  });

  it("returns the admin user for a valid session", async () => {
    mockGetAuthSecret.mockReturnValue("secret");
    mockCookieGet.mockReturnValue({ value: "good-token" });
    mockVerifySessionToken.mockReturnValue({ adminId: "admin_1" });
    mockFindUnique.mockResolvedValue({ id: "admin_1", email: "admin@example.com" });

    const result = await verifyAdminSession();

    expect(result).toEqual({ id: "admin_1", email: "admin@example.com" });
  });
});

describe("requireAdmin", () => {
  it("returns the admin user when the session is valid", async () => {
    mockGetAuthSecret.mockReturnValue("secret");
    mockCookieGet.mockReturnValue({ value: "good-token" });
    mockVerifySessionToken.mockReturnValue({ adminId: "admin_1" });
    mockFindUnique.mockResolvedValue({ id: "admin_1", email: "admin@example.com" });

    const result = await requireAdmin();

    expect(result).toEqual({ id: "admin_1", email: "admin@example.com" });
    expect(mockRedirect).not.toHaveBeenCalled();
  });

  it("redirects to /admin/login when there is no valid session — independent of any Proxy logic", async () => {
    mockGetAuthSecret.mockReturnValue(null);

    await expect(requireAdmin()).rejects.toThrow("REDIRECT:/admin/login");
  });
});
