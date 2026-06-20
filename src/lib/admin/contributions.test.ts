import { beforeEach, describe, expect, it, vi } from "vitest";
import { PaymentStatus } from "@prisma/client";

const { mockCampaignFindUnique, mockContributionCount, mockContributionFindMany } = vi.hoisted(() => ({
  mockCampaignFindUnique: vi.fn(),
  mockContributionCount: vi.fn(),
  mockContributionFindMany: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    campaign: { findUnique: mockCampaignFindUnique },
    contribution: { count: mockContributionCount, findMany: mockContributionFindMany },
  },
}));

const { getContributionsPage, parseStatusFilter } = await import("@/lib/admin/contributions");

beforeEach(() => {
  mockCampaignFindUnique.mockReset();
  mockContributionCount.mockReset();
  mockContributionFindMany.mockReset();
});

describe("parseStatusFilter", () => {
  it("accepts a valid status", () => {
    expect(parseStatusFilter("CONFIRMED")).toBe(PaymentStatus.CONFIRMED);
  });

  it("rejects an invalid status", () => {
    expect(parseStatusFilter("NOT_A_STATUS")).toBeUndefined();
  });

  it("returns undefined for no filter", () => {
    expect(parseStatusFilter(undefined)).toBeUndefined();
  });
});

describe("getContributionsPage", () => {
  it("returns an empty result when the campaign does not exist", async () => {
    mockCampaignFindUnique.mockResolvedValue(null);

    const result = await getContributionsPage(1);

    expect(result).toEqual({ items: [], totalCount: 0, page: 1, pageSize: 20, totalPages: 0 });
  });

  it("orders newest-first by default and applies pagination math", async () => {
    mockCampaignFindUnique.mockResolvedValue({ id: "camp_1" });
    mockContributionCount.mockResolvedValue(45);
    mockContributionFindMany.mockResolvedValue([]);

    const result = await getContributionsPage(2);

    expect(mockContributionFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { createdAt: "desc" }, skip: 20, take: 20 }),
    );
    expect(result.totalPages).toBe(3);
    expect(result.page).toBe(2);
  });

  it("applies a status filter to both the count and the list query", async () => {
    mockCampaignFindUnique.mockResolvedValue({ id: "camp_1" });
    mockContributionCount.mockResolvedValue(0);
    mockContributionFindMany.mockResolvedValue([]);

    await getContributionsPage(1, PaymentStatus.FAILED);

    expect(mockContributionCount).toHaveBeenCalledWith({
      where: { campaignId: "camp_1", paymentStatus: PaymentStatus.FAILED },
    });
  });

  it("shows the real submitted name for admin review even when publicNameHidden is true", async () => {
    mockCampaignFindUnique.mockResolvedValue({ id: "camp_1" });
    mockContributionCount.mockResolvedValue(1);
    mockContributionFindMany.mockResolvedValue([
      {
        id: "contrib_1",
        createdAt: new Date(),
        confirmedAt: new Date(),
        amountCents: 500,
        paymentStatus: PaymentStatus.CONFIRMED,
        refundedAmountCents: 0,
        publicName: "Henry",
        isAnonymous: false,
        publicNameHidden: true,
        contributorNumber: 1,
      },
    ]);

    const result = await getContributionsPage(1);

    expect(result.items[0].displayName).toBe("Henry");
    expect(result.items[0].publicNameHidden).toBe(true);
  });

  it("normalizes a non-positive page number to 1", async () => {
    mockCampaignFindUnique.mockResolvedValue({ id: "camp_1" });
    mockContributionCount.mockResolvedValue(0);
    mockContributionFindMany.mockResolvedValue([]);

    const result = await getContributionsPage(-5);

    expect(result.page).toBe(1);
    expect(mockContributionFindMany).toHaveBeenCalledWith(expect.objectContaining({ skip: 0 }));
  });
});
