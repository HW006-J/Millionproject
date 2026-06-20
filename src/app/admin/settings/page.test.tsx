import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockRequireAdmin, mockCampaignFindUnique } = vi.hoisted(() => ({
  mockRequireAdmin: vi.fn(),
  mockCampaignFindUnique: vi.fn(),
}));

vi.mock("@/lib/admin/auth", () => ({
  requireAdmin: mockRequireAdmin,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: { campaign: { findUnique: mockCampaignFindUnique } },
}));

const { default: AdminSettingsPage } = await import("@/app/admin/settings/page");

beforeEach(() => {
  mockRequireAdmin.mockReset();
  mockCampaignFindUnique.mockReset();
});

describe("AdminSettingsPage", () => {
  it("calls requireAdmin() directly, independent of Proxy or any layout", async () => {
    mockRequireAdmin.mockResolvedValue({ id: "admin_1", email: "admin@example.com" });
    mockCampaignFindUnique.mockResolvedValue({
      isActive: true,
      targetAmountCents: 100_000_000,
      confirmedAmountCents: 100,
    });

    await AdminSettingsPage();

    expect(mockRequireAdmin).toHaveBeenCalledTimes(1);
  });

  it("propagates the redirect when there is no valid session, before reading the campaign", async () => {
    mockRequireAdmin.mockRejectedValue(new Error("REDIRECT:/admin/login"));

    await expect(AdminSettingsPage()).rejects.toThrow("REDIRECT:/admin/login");

    expect(mockCampaignFindUnique).not.toHaveBeenCalled();
  });
});
