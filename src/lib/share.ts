import { PaymentStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export interface ShareData {
  amountCents: number | null;
  displayName: string;
  contributorNumber: number | null;
  confirmedAt: string;
  campaign: {
    confirmedAmountCents: number;
    targetAmountCents: number;
  };
}

/**
 * Returns only fields that are safe to expose publicly. Never returns data
 * for a contribution that isn't CONFIRMED (no pending/failed contributions),
 * and never includes email hashes, provider IDs, or other private metadata.
 * Suppresses the display name to "Anonymous" if an admin has moderated it
 * (publicNameHidden), in addition to the contributor's own anonymous choice.
 */
export async function getShareData(contributionId: string): Promise<ShareData | null> {
  try {
    const contribution = await prisma.contribution.findUnique({
      where: { id: contributionId },
      select: {
        amountCents: true,
        publicName: true,
        isAnonymous: true,
        publicNameHidden: true,
        hideAmountPublicly: true,
        contributorNumber: true,
        confirmedAt: true,
        paymentStatus: true,
        campaignId: true,
      },
    });

    if (
      !contribution ||
      contribution.paymentStatus !== PaymentStatus.CONFIRMED ||
      !contribution.confirmedAt
    ) {
      return null;
    }

    const campaign = await prisma.campaign.findUnique({
      where: { id: contribution.campaignId },
      select: { confirmedAmountCents: true, targetAmountCents: true },
    });

    if (!campaign) {
      return null;
    }

    return {
      amountCents: contribution.hideAmountPublicly ? null : contribution.amountCents,
      // Anonymous contributions stay anonymous regardless of moderation.
      // publicNameHidden is an admin-only suppression flag, separate from
      // the contributor's own anonymous choice.
      displayName:
        contribution.isAnonymous || contribution.publicNameHidden || !contribution.publicName
          ? "Anonymous"
          : contribution.publicName,
      contributorNumber: contribution.contributorNumber,
      confirmedAt: contribution.confirmedAt.toISOString(),
      campaign: {
        confirmedAmountCents: campaign.confirmedAmountCents,
        targetAmountCents: campaign.targetAmountCents,
      },
    };
  } catch (error) {
    console.error("Failed to load share data:", error);
    return null;
  }
}
