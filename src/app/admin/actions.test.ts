import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockCookieDelete, mockRedirect } = vi.hoisted(() => ({
  mockCookieDelete: vi.fn(),
  mockRedirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({ delete: mockCookieDelete })),
}));

vi.mock("next/navigation", () => ({
  redirect: mockRedirect,
}));

const { logoutAction } = await import("@/app/admin/actions");

beforeEach(() => {
  mockCookieDelete.mockReset();
  mockRedirect.mockClear();
});

describe("logoutAction", () => {
  it("fully deletes the session cookie (matching path) and redirects to login", async () => {
    await expect(logoutAction()).rejects.toThrow("REDIRECT:/admin/login");

    expect(mockCookieDelete).toHaveBeenCalledWith({ name: "admin_session", path: "/" });
  });
});
