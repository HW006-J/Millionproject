import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockRequireAdmin,
  mockGetDashboardMetrics,
  mockGetRecentContributions,
  mockGetDailyActivity,
  mockGetHourlyActivity,
} = vi.hoisted(() => ({
  mockRequireAdmin: vi.fn(),
  mockGetDashboardMetrics: vi.fn(),
  mockGetRecentContributions: vi.fn(),
  mockGetDailyActivity: vi.fn(),
  mockGetHourlyActivity: vi.fn(),
}));

vi.mock("@/lib/admin/auth", () => ({
  requireAdmin: mockRequireAdmin,
}));

vi.mock("@/lib/admin/dashboard", () => ({
  getDashboardMetrics: mockGetDashboardMetrics,
}));

vi.mock("@/lib/admin/activity", () => ({
  getRecentContributions: mockGetRecentContributions,
}));

vi.mock("@/lib/admin/charts", () => ({
  getDailyActivity: mockGetDailyActivity,
  getHourlyActivity: mockGetHourlyActivity,
}));

vi.mock("@/app/admin/actions", () => ({
  logoutAction: vi.fn(),
}));

const { default: AdminPage } = await import("@/app/admin/page");

beforeEach(() => {
  mockRequireAdmin.mockReset();
  mockGetDashboardMetrics.mockReset();
  mockGetRecentContributions.mockReset();
  mockGetDailyActivity.mockReset();
  mockGetHourlyActivity.mockReset();
});

function baseMetrics(overrides: Record<string, unknown> = {}) {
  return {
    campaignName: "ONE MILLION",
    isActive: true,
    currency: "usd",
    targetAmountCents: 100_000_000,
    confirmedAmountCents: 100,
    remainingCents: 99_999_900,
    progressPercent: 0.0001,
    confirmedContributionCount: 1,
    pendingCount: 0,
    pendingAmountCents: 0,
    failedCount: 0,
    failedAmountCents: 0,
    totalRefundedCents: 0,
    contributionsCreatedToday: 0,
    contributionsCreatedLast7Days: 1,
    paymentsMode: "mock",
    webhookFailureCount: 0,
    ...overrides,
  };
}

describe("AdminPage", () => {
  it("calls requireAdmin() directly — protected independently of Proxy or any layout", async () => {
    mockRequireAdmin.mockResolvedValue({ id: "admin_1", email: "admin@example.com" });
    mockGetDashboardMetrics.mockResolvedValue(baseMetrics());
    mockGetRecentContributions.mockResolvedValue([]);
    mockGetDailyActivity.mockResolvedValue([]);
    mockGetHourlyActivity.mockResolvedValue([]);

    await AdminPage();

    expect(mockRequireAdmin).toHaveBeenCalledTimes(1);
  });

  it("propagates requireAdmin's redirect when there is no valid session, before reading any dashboard data", async () => {
    mockRequireAdmin.mockRejectedValue(new Error("REDIRECT:/admin/login"));

    await expect(AdminPage()).rejects.toThrow("REDIRECT:/admin/login");

    expect(mockGetDashboardMetrics).not.toHaveBeenCalled();
  });

  it("handles a missing campaign without crashing", async () => {
    mockRequireAdmin.mockResolvedValue({ id: "admin_1", email: "admin@example.com" });
    mockGetDashboardMetrics.mockResolvedValue(null);
    mockGetRecentContributions.mockResolvedValue([]);
    mockGetDailyActivity.mockResolvedValue([]);
    mockGetHourlyActivity.mockResolvedValue([]);

    const result = await AdminPage();

    expect(result).toBeTruthy();
  });
});
