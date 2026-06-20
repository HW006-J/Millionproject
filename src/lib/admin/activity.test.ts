import { beforeEach, describe, expect, it, vi } from "vitest";
import { PaymentStatus } from "@prisma/client";

const { mockCampaignFindUnique, mockContributionFindMany } = vi.hoisted(() => ({
  mockCampaignFindUnique: vi.fn(),
  mockContributionFindMany: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    campaign: { findUnique: mockCampaignFindUnique },
    contribution: { findMany: mockContributionFindMany },
  },
}));

const { getRecentContributions } = await import("@/lib/admin/activity");

beforeEach(() => {
  mockCampaignFindUnique.mockReset();
  mockContributionFindMany.mockReset();
});

describe("getRecentContributions", () => {
  it("returns an empty list when the campaign does not exist", async () => {
    mockCampaignFindUnique.mockResolvedValue(null);

    const result = await getRecentContributions();

    expect(result).toEqual([]);
    expect(mockContributionFindMany).not.toHaveBeenCalled();
  });

  it("shows the real submitted name for admin audit, with publicNameHidden as a separate flag", async () => {
    mockCampaignFindUnique.mockResolvedValue({ id: "camp_1" });
    mockContributionFindMany.mockResolvedValue([
      {
        id: "contribution_with_a_long_id_1",
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        amountCents: 500,
        paymentStatus: PaymentStatus.CONFIRMED,
        publicName: "Henry",
        isAnonymous: false,
        publicNameHidden: true,
        refundedAmountCents: 0,
      },
    ]);

    const [item] = await getRecentContributions();

    expect(item.displayName).toBe("Henry"); // not suppressed for the admin
    expect(item.publicNameHidden).toBe(true); // but the flag is exposed for a UI badge
    expect(item.shortId).toBe("ong_id_1");
  });

  it("shows Anonymous for anonymous contributions regardless of publicName", async () => {
    mockCampaignFindUnique.mockResolvedValue({ id: "camp_1" });
    mockContributionFindMany.mockResolvedValue([
      {
        id: "contrib_2",
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        amountCents: 1000,
        paymentStatus: PaymentStatus.CONFIRMED,
        publicName: null,
        isAnonymous: true,
        publicNameHidden: false,
        refundedAmountCents: 0,
      },
    ]);

    const [item] = await getRecentContributions();

    expect(item.displayName).toBe("Anonymous");
  });

  it("orders newest first and respects the limit", async () => {
    mockCampaignFindUnique.mockResolvedValue({ id: "camp_1" });
    mockContributionFindMany.mockResolvedValue([]);

    await getRecentContributions(5);

    expect(mockContributionFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { createdAt: "desc" }, take: 5 }),
    );
  });
});
