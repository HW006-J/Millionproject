import { PaymentProvider, PaymentStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type RefundContributionResult =
  | { status: "applied"; contributionId: string; deltaCents: number }
  | { status: "no_op"; contributionId: string }
  | { status: "not_found" }
  | { status: "provider_mismatch" }
  | { status: "not_confirmed" };

/**
 * Applies a refund using Stripe's cumulative `amount_refunded` for the charge
 * (not a per-event delta). This makes duplicate and out-of-order webhook
 * delivery safe: the delta against our own stored refundedAmountCents is
 * computed fresh each time, and a non-positive delta is always a no-op.
 * Both the contribution and campaign updates happen in one transaction,
 * guarded by a conditional update so concurrent refund events can't both
 * apply the same delta twice. Amounts are clamped so neither the
 * contribution's refunded total nor the campaign total can go negative or
 * exceed what was actually paid.
 *
 * Deliberately never touches Campaign.confirmedContributionCount — that
 * field is a lifetime count used for contributor numbering (see the admin
 * dashboard's "Lifetime count" sublabel) and is never decremented by a
 * partial or full refund, even though confirmedAmountCents is.
 */
export async function refundContribution(
  contributionId: string,
  expectedProvider: PaymentProvider,
  cumulativeRefundedAmountCents: number,
): Promise<RefundContributionResult> {
  return prisma.$transaction(async (tx) => {
    const contribution = await tx.contribution.findUnique({ where: { id: contributionId } });

    if (!contribution) {
      return { status: "not_found" };
    }

    if (contribution.paymentProvider !== expectedProvider) {
      return { status: "provider_mismatch" };
    }

    if (
      contribution.paymentStatus !== PaymentStatus.CONFIRMED &&
      contribution.paymentStatus !== PaymentStatus.REFUNDED
    ) {
      // A refund for something that was never confirmed — unexpected/out-of-order
      // delivery. Never decrement campaign totals for money that was never added.
      return { status: "not_confirmed" };
    }

    const clampedNewTotal = Math.min(
      Math.max(0, cumulativeRefundedAmountCents),
      contribution.amountCents,
    );

    const delta = clampedNewTotal - contribution.refundedAmountCents;
    if (delta <= 0) {
      return { status: "no_op", contributionId };
    }

    const isFullyRefunded = clampedNewTotal >= contribution.amountCents;

    const updateResult = await tx.contribution.updateMany({
      where: { id: contributionId, refundedAmountCents: contribution.refundedAmountCents },
      data: {
        refundedAmountCents: clampedNewTotal,
        refundedAt: new Date(),
        paymentStatus: isFullyRefunded ? PaymentStatus.REFUNDED : contribution.paymentStatus,
      },
    });

    if (updateResult.count === 0) {
      // Lost a race to another concurrent refund event for the same contribution.
      return { status: "no_op", contributionId };
    }

    const campaign = await tx.campaign.findUnique({ where: { id: contribution.campaignId } });
    if (campaign) {
      const newCampaignTotal = Math.max(0, campaign.confirmedAmountCents - delta);
      await tx.campaign.update({
        where: { id: campaign.id },
        data: { confirmedAmountCents: newCampaignTotal },
      });
    }

    return { status: "applied", contributionId, deltaCents: delta };
  });
}
