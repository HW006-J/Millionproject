import { beforeEach, describe, expect, it, vi } from "vitest";
import { PaymentProvider, PaymentStatus } from "@prisma/client";

/**
 * End-to-end coverage (real confirmContribution, not mocked) for the Phase
 * 5B race case:
 *   1. Campaign is active when a pending Contribution + Checkout Session
 *      are created.
 *   2. Admin pauses the campaign (Campaign.isActive -> false).
 *   3. Stripe's checkout.session.completed webhook arrives afterward.
 *   4. The legitimate, already-collected payment must still be confirmed —
 *      exactly once.
 * confirmContribution() no longer reads Campaign.isActive at all, so this
 * test never even needs to query the campaign's pause state to prove it:
 * the absence of that check is exactly what makes this scenario safe.
 */

const {
  mockContributionFindUnique,
  mockContributionUpdate,
  mockTransaction,
  mockTxContributionFindUnique,
  mockTxContributionUpdateMany,
  mockTxContributionUpdate,
  mockTxCampaignUpdate,
} = vi.hoisted(() => ({
  mockContributionFindUnique: vi.fn(),
  mockContributionUpdate: vi.fn(),
  mockTransaction: vi.fn(),
  mockTxContributionFindUnique: vi.fn(),
  mockTxContributionUpdateMany: vi.fn(),
  mockTxContributionUpdate: vi.fn(),
  mockTxCampaignUpdate: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    contribution: { findUnique: mockContributionFindUnique, update: mockContributionUpdate },
    $transaction: mockTransaction,
  },
}));

const { handleCheckoutSessionCompleted } = await import("@/lib/webhooks/handleCheckoutSessionCompleted");

beforeEach(() => {
  mockContributionFindUnique.mockReset();
  mockContributionUpdate.mockReset();
  mockTransaction.mockReset();
  mockTxContributionFindUnique.mockReset();
  mockTxContributionUpdateMany.mockReset();
  mockTxContributionUpdate.mockReset();
  mockTxCampaignUpdate.mockReset();

  mockTransaction.mockImplementation((callback: (tx: unknown) => unknown) =>
    callback({
      contribution: {
        findUnique: mockTxContributionFindUnique,
        updateMany: mockTxContributionUpdateMany,
        update: mockTxContributionUpdate,
      },
      campaign: { update: mockTxCampaignUpdate },
    }),
  );
});

describe("pause must not block an already-in-flight Stripe payment", () => {
  it("confirms the legitimate payment exactly once via the real webhook handler + confirmContribution", async () => {
    const contributionId = "contrib_1";

    mockContributionFindUnique.mockResolvedValue({
      id: contributionId,
      providerSessionId: "cs_1",
      paymentProvider: PaymentProvider.STRIPE,
      paymentStatus: PaymentStatus.PENDING,
      amountCents: 500,
    });
    mockContributionUpdate.mockResolvedValue({});

    mockTxContributionFindUnique.mockResolvedValue({
      id: contributionId,
      campaignId: "camp_1",
      amountCents: 500,
      paymentProvider: PaymentProvider.STRIPE,
      paymentStatus: PaymentStatus.PENDING,
    });
    mockTxContributionUpdateMany.mockResolvedValue({ count: 1 });
    mockTxCampaignUpdate.mockResolvedValue({
      id: "camp_1",
      confirmedAmountCents: 600,
      confirmedContributionCount: 1,
    });
    mockTxContributionUpdate.mockResolvedValue({});

    const session = {
      id: "cs_1",
      currency: "usd",
      amount_total: 500,
      payment_status: "paid",
      payment_intent: "pi_1",
      metadata: { contributionId },
    } as never;

    await handleCheckoutSessionCompleted(session);

    // No code path here ever reads Campaign.isActive — confirmation
    // proceeded purely on the contribution's own pending state.
    expect(mockTxContributionUpdateMany).toHaveBeenCalledWith({
      where: { id: contributionId, paymentStatus: PaymentStatus.PENDING },
      data: { paymentStatus: PaymentStatus.CONFIRMED, confirmedAt: expect.any(Date) },
    });
    expect(mockTxCampaignUpdate).toHaveBeenCalledTimes(1);
    expect(mockTxCampaignUpdate).toHaveBeenCalledWith({
      where: { id: "camp_1" },
      data: {
        confirmedAmountCents: { increment: 500 },
        confirmedContributionCount: { increment: 1 },
      },
    });
  });
});
