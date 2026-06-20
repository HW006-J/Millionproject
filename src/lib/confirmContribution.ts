import { PaymentProvider, PaymentStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type ConfirmContributionResult =
  | { status: "confirmed"; contributionId: string }
  | { status: "already_confirmed"; contributionId: string }
  | { status: "not_found" }
  | { status: "provider_mismatch" }
  | { status: "campaign_inactive" }
  | { status: "invalid_state" };

/**
 * Atomically confirms a contribution and updates campaign totals.
 * Safe to call more than once for the same contribution: the conditional
 * `updateMany` only succeeds for the first caller, so concurrent or repeated
 * calls fall through to "already_confirmed" without double-counting.
 */
export async function confirmContribution(
  contributionId: string,
  expectedProvider: PaymentProvider,
): Promise<ConfirmContributionResult> {
  return prisma.$transaction(async (tx) => {
    const contribution = await tx.contribution.findUnique({
      where: { id: contributionId },
      include: { campaign: true },
    });

    if (!contribution) {
      return { status: "not_found" };
    }

    if (contribution.paymentProvider !== expectedProvider) {
      return { status: "provider_mismatch" };
    }

    if (!contribution.campaign.isActive) {
      return { status: "campaign_inactive" };
    }

    if (contribution.paymentStatus === PaymentStatus.CONFIRMED) {
      return { status: "already_confirmed", contributionId };
    }

    if (contribution.paymentStatus !== PaymentStatus.PENDING) {
      return { status: "invalid_state" };
    }

    const updateResult = await tx.contribution.updateMany({
      where: { id: contributionId, paymentStatus: PaymentStatus.PENDING },
      data: { paymentStatus: PaymentStatus.CONFIRMED, confirmedAt: new Date() },
    });

    if (updateResult.count === 0) {
      // Lost a race to another concurrent confirmation of the same contribution.
      return { status: "already_confirmed", contributionId };
    }

    const campaign = await tx.campaign.update({
      where: { id: contribution.campaignId },
      data: {
        confirmedAmountCents: { increment: contribution.amountCents },
        confirmedContributionCount: { increment: 1 },
      },
    });

    await tx.contribution.update({
      where: { id: contributionId },
      data: { contributorNumber: campaign.confirmedContributionCount },
    });

    return { status: "confirmed", contributionId };
  });
}
