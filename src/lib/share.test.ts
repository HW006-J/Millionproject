import { beforeEach, describe, expect, it, vi } from "vitest";
import { PaymentStatus } from "@prisma/client";
import { getShareData } from "@/lib/share";

const { mockFindUniqueContribution, mockFindUniqueCampaign } = vi.hoisted(() => ({
  mockFindUniqueContribution: vi.fn(),
  mockFindUniqueCampaign: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    contribution: { findUnique: mockFindUniqueContribution },
    campaign: { findUnique: mockFindUniqueCampaign },
  },
}));

beforeEach(() => {
  mockFindUniqueContribution.mockReset();
  mockFindUniqueCampaign.mockReset();
});

describe("getShareData", () => {
  it("returns null for a contribution that is not confirmed", async () => {
    mockFindUniqueContribution.mockResolvedValue({
      amountCents: 500,
      publicName: "Henry",
      isAnonymous: false,
      hideAmountPublicly: false,
      contributorNumber: 1,
      confirmedAt: null,
      paymentStatus: PaymentStatus.PENDING,
      campaignId: "camp_1",
    });

    const result = await getShareData("contrib_1");

    expect(result).toBeNull();
    expect(mockFindUniqueCampaign).not.toHaveBeenCalled();
  });

  it("returns null for a contribution that does not exist", async () => {
    mockFindUniqueContribution.mockResolvedValue(null);

    const result = await getShareData("missing");

    expect(result).toBeNull();
  });

  it("hides the amount when hideAmountPublicly is true", async () => {
    const confirmedAt = new Date("2026-01-01T00:00:00.000Z");
    mockFindUniqueContribution.mockResolvedValue({
      amountCents: 500,
      publicName: "Henry",
      isAnonymous: false,
      hideAmountPublicly: true,
      contributorNumber: 2,
      confirmedAt,
      paymentStatus: PaymentStatus.CONFIRMED,
      campaignId: "camp_1",
    });
    mockFindUniqueCampaign.mockResolvedValue({
      confirmedAmountCents: 5000,
      targetAmountCents: 100_000_000,
    });

    const result = await getShareData("contrib_1");

    expect(result).toEqual({
      amountCents: null,
      displayName: "Henry",
      contributorNumber: 2,
      confirmedAt: confirmedAt.toISOString(),
      campaign: { confirmedAmountCents: 5000, targetAmountCents: 100_000_000 },
    });
  });

  it("shows Anonymous for anonymous contributions and exposes only approved fields", async () => {
    const confirmedAt = new Date("2026-01-01T00:00:00.000Z");
    mockFindUniqueContribution.mockResolvedValue({
      amountCents: 1000,
      publicName: null,
      isAnonymous: true,
      hideAmountPublicly: false,
      contributorNumber: 5,
      confirmedAt,
      paymentStatus: PaymentStatus.CONFIRMED,
      campaignId: "camp_1",
    });
    mockFindUniqueCampaign.mockResolvedValue({
      confirmedAmountCents: 9000,
      targetAmountCents: 100_000_000,
    });

    const result = await getShareData("contrib_2");

    expect(result).toEqual({
      amountCents: 1000,
      displayName: "Anonymous",
      contributorNumber: 5,
      confirmedAt: confirmedAt.toISOString(),
      campaign: { confirmedAmountCents: 9000, targetAmountCents: 100_000_000 },
    });
    expect(result).not.toHaveProperty("emailHash");
    expect(result).not.toHaveProperty("providerSessionId");
    expect(result).not.toHaveProperty("providerPaymentId");
    expect(result).not.toHaveProperty("metadata");
  });
});
