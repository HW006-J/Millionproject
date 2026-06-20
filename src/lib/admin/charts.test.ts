import { beforeEach, describe, expect, it, vi } from "vitest";

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

const { getDailyActivity, getHourlyActivity } = await import("@/lib/admin/charts");

beforeEach(() => {
  mockCampaignFindUnique.mockReset();
  mockContributionFindMany.mockReset();
});

describe("getDailyActivity", () => {
  it("returns an empty array when the campaign does not exist", async () => {
    mockCampaignFindUnique.mockResolvedValue(null);

    const result = await getDailyActivity(7);

    expect(result).toEqual([]);
  });

  it("returns one zeroed bucket per day with no contributions at all (empty dataset)", async () => {
    mockCampaignFindUnique.mockResolvedValue({ id: "camp_1" });
    mockContributionFindMany.mockResolvedValue([]);

    const result = await getDailyActivity(7);

    expect(result).toHaveLength(7);
    for (const bucket of result) {
      expect(bucket.count).toBe(0);
      expect(bucket.amountCents).toBe(0);
      expect(typeof bucket.label).toBe("string");
    }
  });

  it("buckets confirmed contributions into the correct UTC day and keeps amounts separate from counts", async () => {
    mockCampaignFindUnique.mockResolvedValue({ id: "camp_1" });
    const today = new Date();
    const todayUTCMidday = new Date(
      Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 12),
    );
    mockContributionFindMany.mockResolvedValue([
      { confirmedAt: todayUTCMidday, amountCents: 500 },
      { confirmedAt: todayUTCMidday, amountCents: 300 },
    ]);

    const result = await getDailyActivity(7);
    const todayBucket = result[result.length - 1];

    expect(todayBucket.count).toBe(2);
    expect(todayBucket.amountCents).toBe(800);
  });
});

describe("getHourlyActivity", () => {
  it("returns one zeroed bucket per hour with no contributions at all", async () => {
    mockCampaignFindUnique.mockResolvedValue({ id: "camp_1" });
    mockContributionFindMany.mockResolvedValue([]);

    const result = await getHourlyActivity(24);

    expect(result).toHaveLength(24);
    expect(result.every((bucket) => bucket.count === 0 && bucket.amountCents === 0)).toBe(true);
  });

  it("uses zero-padded HH:00 UTC labels", async () => {
    mockCampaignFindUnique.mockResolvedValue({ id: "camp_1" });
    mockContributionFindMany.mockResolvedValue([]);

    const result = await getHourlyActivity(24);

    for (const bucket of result) {
      expect(bucket.label).toMatch(/^\d{2}:00$/);
    }
  });
});
