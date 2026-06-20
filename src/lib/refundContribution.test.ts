import { beforeEach, describe, expect, it, vi } from "vitest";
import { PaymentProvider, PaymentStatus } from "@prisma/client";
import { refundContribution } from "@/lib/refundContribution";

const { mockTx } = vi.hoisted(() => ({
  mockTx: {
    contribution: {
      findUnique: vi.fn(),
      updateMany: vi.fn(),
    },
    campaign: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: vi.fn((callback: (tx: typeof mockTx) => unknown) => callback(mockTx)),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

function confirmedContribution(overrides: Record<string, unknown> = {}) {
  return {
    id: "contrib_1",
    campaignId: "camp_1",
    amountCents: 1000,
    refundedAmountCents: 0,
    paymentProvider: PaymentProvider.STRIPE,
    paymentStatus: PaymentStatus.CONFIRMED,
    ...overrides,
  };
}

describe("refundContribution", () => {
  it("applies a full refund and decrements the campaign total once", async () => {
    mockTx.contribution.findUnique.mockResolvedValue(confirmedContribution());
    mockTx.contribution.updateMany.mockResolvedValue({ count: 1 });
    mockTx.campaign.findUnique.mockResolvedValue({ id: "camp_1", confirmedAmountCents: 5000 });
    mockTx.campaign.update.mockResolvedValue({});

    const result = await refundContribution("contrib_1", PaymentProvider.STRIPE, 1000);

    expect(result).toEqual({ status: "applied", contributionId: "contrib_1", deltaCents: 1000 });
    expect(mockTx.contribution.updateMany).toHaveBeenCalledWith({
      where: { id: "contrib_1", refundedAmountCents: 0 },
      data: {
        refundedAmountCents: 1000,
        refundedAt: expect.any(Date),
        paymentStatus: PaymentStatus.REFUNDED,
      },
    });
    expect(mockTx.campaign.update).toHaveBeenCalledWith({
      where: { id: "camp_1" },
      data: { confirmedAmountCents: 4000 },
    });
  });

  it("applies a partial refund and keeps the contribution CONFIRMED", async () => {
    mockTx.contribution.findUnique.mockResolvedValue(confirmedContribution());
    mockTx.contribution.updateMany.mockResolvedValue({ count: 1 });
    mockTx.campaign.findUnique.mockResolvedValue({ id: "camp_1", confirmedAmountCents: 5000 });
    mockTx.campaign.update.mockResolvedValue({});

    const result = await refundContribution("contrib_1", PaymentProvider.STRIPE, 400);

    expect(result).toEqual({ status: "applied", contributionId: "contrib_1", deltaCents: 400 });
    expect(mockTx.contribution.updateMany).toHaveBeenCalledWith({
      where: { id: "contrib_1", refundedAmountCents: 0 },
      data: {
        refundedAmountCents: 400,
        refundedAt: expect.any(Date),
        paymentStatus: PaymentStatus.CONFIRMED,
      },
    });
    expect(mockTx.campaign.update).toHaveBeenCalledWith({
      where: { id: "camp_1" },
      data: { confirmedAmountCents: 4600 },
    });
  });

  it("is a no-op for a duplicate delivery of the same cumulative refund amount", async () => {
    mockTx.contribution.findUnique.mockResolvedValue(
      confirmedContribution({ refundedAmountCents: 400 }),
    );

    const result = await refundContribution("contrib_1", PaymentProvider.STRIPE, 400);

    expect(result).toEqual({ status: "no_op", contributionId: "contrib_1" });
    expect(mockTx.contribution.updateMany).not.toHaveBeenCalled();
    expect(mockTx.campaign.update).not.toHaveBeenCalled();
  });

  it("is a no-op for an out-of-order (smaller) cumulative refund amount", async () => {
    mockTx.contribution.findUnique.mockResolvedValue(
      confirmedContribution({ refundedAmountCents: 1000 }),
    );

    const result = await refundContribution("contrib_1", PaymentProvider.STRIPE, 400);

    expect(result).toEqual({ status: "no_op", contributionId: "contrib_1" });
  });

  it("applies a second partial refund on top of a first one correctly", async () => {
    mockTx.contribution.findUnique.mockResolvedValue(
      confirmedContribution({ refundedAmountCents: 400 }),
    );
    mockTx.contribution.updateMany.mockResolvedValue({ count: 1 });
    mockTx.campaign.findUnique.mockResolvedValue({ id: "camp_1", confirmedAmountCents: 4600 });
    mockTx.campaign.update.mockResolvedValue({});

    const result = await refundContribution("contrib_1", PaymentProvider.STRIPE, 1000);

    expect(result).toEqual({ status: "applied", contributionId: "contrib_1", deltaCents: 600 });
    expect(mockTx.campaign.update).toHaveBeenCalledWith({
      where: { id: "camp_1" },
      data: { confirmedAmountCents: 4000 },
    });
  });

  it("never lets the campaign total go negative", async () => {
    mockTx.contribution.findUnique.mockResolvedValue(confirmedContribution());
    mockTx.contribution.updateMany.mockResolvedValue({ count: 1 });
    mockTx.campaign.findUnique.mockResolvedValue({ id: "camp_1", confirmedAmountCents: 300 });
    mockTx.campaign.update.mockResolvedValue({});

    await refundContribution("contrib_1", PaymentProvider.STRIPE, 1000);

    expect(mockTx.campaign.update).toHaveBeenCalledWith({
      where: { id: "camp_1" },
      data: { confirmedAmountCents: 0 },
    });
  });

  it("clamps a refunded amount that exceeds what was actually paid", async () => {
    mockTx.contribution.findUnique.mockResolvedValue(confirmedContribution());
    mockTx.contribution.updateMany.mockResolvedValue({ count: 1 });
    mockTx.campaign.findUnique.mockResolvedValue({ id: "camp_1", confirmedAmountCents: 5000 });
    mockTx.campaign.update.mockResolvedValue({});

    const result = await refundContribution("contrib_1", PaymentProvider.STRIPE, 999_999);

    expect(result).toEqual({ status: "applied", contributionId: "contrib_1", deltaCents: 1000 });
  });

  it("loses a race safely when another refund event applies first", async () => {
    mockTx.contribution.findUnique.mockResolvedValue(confirmedContribution());
    mockTx.contribution.updateMany.mockResolvedValue({ count: 0 });

    const result = await refundContribution("contrib_1", PaymentProvider.STRIPE, 1000);

    expect(result).toEqual({ status: "no_op", contributionId: "contrib_1" });
    expect(mockTx.campaign.update).not.toHaveBeenCalled();
  });

  it("returns not_found for a missing contribution", async () => {
    mockTx.contribution.findUnique.mockResolvedValue(null);

    const result = await refundContribution("missing", PaymentProvider.STRIPE, 1000);

    expect(result).toEqual({ status: "not_found" });
  });

  it("returns provider_mismatch when the provider differs", async () => {
    mockTx.contribution.findUnique.mockResolvedValue(
      confirmedContribution({ paymentProvider: PaymentProvider.MOCK }),
    );

    const result = await refundContribution("contrib_1", PaymentProvider.STRIPE, 1000);

    expect(result).toEqual({ status: "provider_mismatch" });
  });

  it("never refunds a contribution that was never confirmed", async () => {
    mockTx.contribution.findUnique.mockResolvedValue(
      confirmedContribution({ paymentStatus: PaymentStatus.PENDING }),
    );

    const result = await refundContribution("contrib_1", PaymentProvider.STRIPE, 1000);

    expect(result).toEqual({ status: "not_confirmed" });
    expect(mockTx.contribution.updateMany).not.toHaveBeenCalled();
  });
});
