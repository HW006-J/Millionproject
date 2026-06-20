import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockRequireAdmin, mockGetContributionsPage } = vi.hoisted(() => ({
  mockRequireAdmin: vi.fn(),
  mockGetContributionsPage: vi.fn(),
}));

vi.mock("@/lib/admin/auth", () => ({
  requireAdmin: mockRequireAdmin,
}));

vi.mock("@/lib/admin/contributions", async () => {
  const actual = await vi.importActual<typeof import("@/lib/admin/contributions")>(
    "@/lib/admin/contributions",
  );
  return {
    ...actual,
    getContributionsPage: mockGetContributionsPage,
  };
});

const { default: AdminContributionsPage } = await import("@/app/admin/contributions/page");

beforeEach(() => {
  mockRequireAdmin.mockReset();
  mockGetContributionsPage.mockReset();
});

describe("AdminContributionsPage", () => {
  it("calls requireAdmin() directly, independent of Proxy or any layout", async () => {
    mockRequireAdmin.mockResolvedValue({ id: "admin_1", email: "admin@example.com" });
    mockGetContributionsPage.mockResolvedValue({
      items: [],
      totalCount: 0,
      page: 1,
      pageSize: 20,
      totalPages: 1,
    });

    await AdminContributionsPage({ searchParams: Promise.resolve({}) });

    expect(mockRequireAdmin).toHaveBeenCalledTimes(1);
  });

  it("propagates the redirect when there is no valid session, before querying contributions", async () => {
    mockRequireAdmin.mockRejectedValue(new Error("REDIRECT:/admin/login"));

    await expect(
      AdminContributionsPage({ searchParams: Promise.resolve({}) }),
    ).rejects.toThrow("REDIRECT:/admin/login");

    expect(mockGetContributionsPage).not.toHaveBeenCalled();
  });
});
