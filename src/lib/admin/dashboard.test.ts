import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockCampaignFindUnique, mockContributionAggregate, mockContributionCount, mockWebhookEventCount } =
  vi.hoisted(() => ({
    mockCampaignFindUnique: vi.fn(),
    mockContributionAggregate: vi.fn(),
    mockContributionCount: vi.fn(),
    mockWebhookEventCount: vi.fn(),
  }));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    campaign: { findUnique: mockCampaignFindUnique },
    contribution: { aggregate: mockContributionAggregate, count: mockContributionCount },
    webhookEvent: { count: mockWebhookEventCount },
  },
}));

const { getDashboardMetrics } = await import("@/lib/admin/dashboard");

beforeEach(() => {
  mockCampaignFindUnique.mockReset();
  mockContributionAggregate.mockReset();
  mockContributionCount.mockReset();
  mockWebhookEventCount.mockReset();
});

function campaign(overrides: Record<string, unknown> = {}) {
  return {
    id: "camp_1",
    name: "ONE MILLION",
    isActive: true,
    currency: "usd",
    targetAmountCents: 100_000_000,
    confirmedAmountCents: 250_000,
    confirmedContributionCount: 10,
    ...overrides,
  };
}

describe("getDashboardMetrics", () => {
  it("returns null when the campaign does not exist", async () => {
    mockCampaignFindUnique.mockResolvedValue(null);

    const result = await getDashboardMetrics();

    expect(result).toBeNull();
  });

  it("computes remaining/progress from the authoritative campaign fields, never recomputing confirmedAmountCents", async () => {
    mockCampaignFindUnique.mockResolvedValue(campaign());
    mockContributionAggregate
      .mockResolvedValueOnce({ _count: { _all: 3 }, _sum: { amountCents: 1500 } }) // pending
      .mockResolvedValueOnce({ _count: { _all: 2 }, _sum: { amountCents: 800 } }) // failed
      .mockResolvedValueOnce({ _sum: { refundedAmountCents: 200 } }); // refunded
    mockContributionCount.mockResolvedValueOnce(4).mockResolvedValueOnce(9);
    mockWebhookEventCount.mockResolvedValue(1);

    const result = await getDashboardMetrics();

    expect(result).toMatchObject({
      confirmedAmountCents: 250_000,
      remainingCents: 100_000_000 - 250_000,
      progressPercent: (250_000 / 100_000_000) * 100,
      confirmedContributionCount: 10,
      pendingCount: 3,
      pendingAmountCents: 1500,
      failedCount: 2,
      failedAmountCents: 800,
      totalRefundedCents: 200,
      contributionsCreatedToday: 4,
      contributionsCreatedLast7Days: 9,
      webhookFailureCount: 1,
    });
  });

  it("handles a completely empty dataset without dividing by zero or throwing", async () => {
    mockCampaignFindUnique.mockResolvedValue(
      campaign({ confirmedAmountCents: 0, confirmedContributionCount: 0 }),
    );
    mockContributionAggregate
      .mockResolvedValueOnce({ _count: { _all: 0 }, _sum: { amountCents: null } })
      .mockResolvedValueOnce({ _count: { _all: 0 }, _sum: { amountCents: null } })
      .mockResolvedValueOnce({ _sum: { refundedAmountCents: null } });
    mockContributionCount.mockResolvedValueOnce(0).mockResolvedValueOnce(0);
    mockWebhookEventCount.mockResolvedValue(0);

    const result = await getDashboardMetrics();

    expect(result).toMatchObject({
      pendingCount: 0,
      pendingAmountCents: 0,
      failedCount: 0,
      failedAmountCents: 0,
      totalRefundedCents: 0,
      progressPercent: 0,
    });
  });

  it("never reports a progress percentage above 100 even if confirmed exceeds target", async () => {
    mockCampaignFindUnique.mockResolvedValue(
      campaign({ confirmedAmountCents: 200_000_000, targetAmountCents: 100_000_000 }),
    );
    mockContributionAggregate
      .mockResolvedValueOnce({ _count: { _all: 0 }, _sum: { amountCents: null } })
      .mockResolvedValueOnce({ _count: { _all: 0 }, _sum: { amountCents: null } })
      .mockResolvedValueOnce({ _sum: { refundedAmountCents: null } });
    mockContributionCount.mockResolvedValueOnce(0).mockResolvedValueOnce(0);
    mockWebhookEventCount.mockResolvedValue(0);

    const result = await getDashboardMetrics();

    expect(result?.progressPercent).toBe(100);
    expect(result?.remainingCents).toBe(0);
  });

  it("only counts WebhookEvent rows with a recorded failureReason, never inferring failure from absence", async () => {
    mockCampaignFindUnique.mockResolvedValue(campaign());
    mockContributionAggregate
      .mockResolvedValueOnce({ _count: { _all: 0 }, _sum: { amountCents: null } })
      .mockResolvedValueOnce({ _count: { _all: 0 }, _sum: { amountCents: null } })
      .mockResolvedValueOnce({ _sum: { refundedAmountCents: null } });
    mockContributionCount.mockResolvedValueOnce(0).mockResolvedValueOnce(0);
    mockWebhookEventCount.mockResolvedValue(2);

    await getDashboardMetrics();

    expect(mockWebhookEventCount).toHaveBeenCalledWith({ where: { failureReason: { not: null } } });
  });
});
