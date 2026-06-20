import { beforeEach, describe, expect, it, vi } from "vitest";
import { PaymentProvider, PaymentStatus } from "@prisma/client";
import { confirmContribution } from "@/lib/confirmContribution";

const { mockTx } = vi.hoisted(() => ({
  mockTx: {
    contribution: {
      findUnique: vi.fn(),
      updateMany: vi.fn(),
      update: vi.fn(),
    },
    campaign: {
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

function pendingContribution(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "contrib_1",
    campaignId: "camp_1",
    amountCents: 500,
    paymentProvider: PaymentProvider.MOCK,
    paymentStatus: PaymentStatus.PENDING,
    ...overrides,
  };
}

describe("confirmContribution", () => {
  it("confirms a pending contribution and updates campaign totals", async () => {
    mockTx.contribution.findUnique.mockResolvedValue(pendingContribution());
    mockTx.contribution.updateMany.mockResolvedValue({ count: 1 });
    mockTx.campaign.update.mockResolvedValue({
      id: "camp_1",
      confirmedAmountCents: 1500,
      confirmedContributionCount: 3,
    });
    mockTx.contribution.update.mockResolvedValue({});

    const result = await confirmContribution("contrib_1", PaymentProvider.MOCK);

    expect(result).toEqual({ status: "confirmed", contributionId: "contrib_1" });
    expect(mockTx.campaign.update).toHaveBeenCalledWith({
      where: { id: "camp_1" },
      data: {
        confirmedAmountCents: { increment: 500 },
        confirmedContributionCount: { increment: 1 },
      },
    });
    expect(mockTx.contribution.update).toHaveBeenCalledWith({
      where: { id: "contrib_1" },
      data: { contributorNumber: 3 },
    });
  });

  it("does not double-count when the conditional update loses a race", async () => {
    mockTx.contribution.findUnique.mockResolvedValue(pendingContribution());
    // Another concurrent confirmation won first: the row is no longer PENDING.
    mockTx.contribution.updateMany.mockResolvedValue({ count: 0 });

    const result = await confirmContribution("contrib_1", PaymentProvider.MOCK);

    expect(result).toEqual({ status: "already_confirmed", contributionId: "contrib_1" });
    expect(mockTx.campaign.update).not.toHaveBeenCalled();
    expect(mockTx.contribution.update).not.toHaveBeenCalled();
  });

  it("is idempotent when called again on an already-confirmed contribution", async () => {
    mockTx.contribution.findUnique.mockResolvedValue(
      pendingContribution({ paymentStatus: PaymentStatus.CONFIRMED }),
    );

    const result = await confirmContribution("contrib_1", PaymentProvider.MOCK);

    expect(result).toEqual({ status: "already_confirmed", contributionId: "contrib_1" });
    expect(mockTx.contribution.updateMany).not.toHaveBeenCalled();
    expect(mockTx.campaign.update).not.toHaveBeenCalled();
  });

  it("rejects confirmation when the payment provider does not match", async () => {
    mockTx.contribution.findUnique.mockResolvedValue(
      pendingContribution({ paymentProvider: PaymentProvider.STRIPE }),
    );

    const result = await confirmContribution("contrib_1", PaymentProvider.MOCK);

    expect(result).toEqual({ status: "provider_mismatch" });
    expect(mockTx.contribution.updateMany).not.toHaveBeenCalled();
  });

  it("returns not_found for a missing contribution", async () => {
    mockTx.contribution.findUnique.mockResolvedValue(null);

    const result = await confirmContribution("missing", PaymentProvider.MOCK);

    expect(result).toEqual({ status: "not_found" });
  });

  it("confirms a legitimate in-flight payment even after the campaign has been paused (Phase 5B race case)", async () => {
    // 1. Campaign was active when the pending contribution + Checkout Session
    //    were created. 2. Admin pauses the campaign. 3. The completed-payment
    //    webhook arrives afterward. Confirmation must still succeed exactly
    //    once — pausing only gates *new* checkout creation, never honoring
    //    money Stripe already collected.
    mockTx.contribution.findUnique.mockResolvedValue(
      pendingContribution({ paymentProvider: PaymentProvider.STRIPE }),
    );
    mockTx.contribution.updateMany.mockResolvedValue({ count: 1 });
    mockTx.campaign.update.mockResolvedValue({
      id: "camp_1",
      confirmedAmountCents: 600,
      confirmedContributionCount: 1,
    });
    mockTx.contribution.update.mockResolvedValue({});

    const result = await confirmContribution("contrib_1", PaymentProvider.STRIPE);

    expect(result).toEqual({ status: "confirmed", contributionId: "contrib_1" });
    expect(mockTx.campaign.update).toHaveBeenCalledTimes(1);

    // Calling it again (e.g. a duplicate webhook delivery while still paused)
    // must not confirm or count it a second time.
    mockTx.contribution.findUnique.mockResolvedValue(
      pendingContribution({ paymentProvider: PaymentProvider.STRIPE, paymentStatus: PaymentStatus.CONFIRMED }),
    );

    const secondResult = await confirmContribution("contrib_1", PaymentProvider.STRIPE);

    expect(secondResult).toEqual({ status: "already_confirmed", contributionId: "contrib_1" });
    expect(mockTx.campaign.update).toHaveBeenCalledTimes(1);
  });
});
