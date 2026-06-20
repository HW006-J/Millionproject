import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockRequireAdmin } = vi.hoisted(() => ({ mockRequireAdmin: vi.fn() }));

vi.mock("@/lib/admin/auth", () => ({
  requireAdmin: mockRequireAdmin,
}));

vi.mock("@/app/admin/actions", () => ({
  logoutAction: vi.fn(),
}));

const { default: AdminPage } = await import("@/app/admin/page");

beforeEach(() => {
  mockRequireAdmin.mockReset();
});

describe("AdminPage", () => {
  it("calls requireAdmin() directly — protected independently of Proxy or any layout", async () => {
    mockRequireAdmin.mockResolvedValue({ id: "admin_1", email: "admin@example.com" });

    await AdminPage();

    expect(mockRequireAdmin).toHaveBeenCalledTimes(1);
  });

  it("propagates requireAdmin's redirect when there is no valid session", async () => {
    mockRequireAdmin.mockRejectedValue(new Error("REDIRECT:/admin/login"));

    await expect(AdminPage()).rejects.toThrow("REDIRECT:/admin/login");
  });
});
