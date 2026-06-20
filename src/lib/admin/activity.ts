import { CAMPAIGN_SLUG } from "@/lib/campaign";
import { prisma } from "@/lib/prisma";

export interface RecentContributionItem {
  id: string;
  shortId: string;
  createdAt: Date;
  amountCents: number;
  paymentStatus: string;
  /** The real submitted name, for admin audit — never suppressed here. */
  displayName: string;
  isAnonymous: boolean;
  publicNameHidden: boolean;
  refundedAmountCents: number;
}

/**
 * Admin-only view: shows the contributor's *actual* submitted name (subject
 * only to their own anonymous choice), regardless of publicNameHidden — the
 * spec requires the original name stay available to admins for moderation
 * and audit. publicNameHidden is exposed as its own field so the UI can
 * show a "hidden from public" badge without losing the underlying name.
 */
export async function getRecentContributions(limit = 20): Promise<RecentContributionItem[]> {
  const campaign = await prisma.campaign.findUnique({
    where: { slug: CAMPAIGN_SLUG },
    select: { id: true },
  });
  if (!campaign) {
    return [];
  }

  const contributions = await prisma.contribution.findMany({
    where: { campaignId: campaign.id },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      createdAt: true,
      amountCents: true,
      paymentStatus: true,
      publicName: true,
      isAnonymous: true,
      publicNameHidden: true,
      refundedAmountCents: true,
    },
  });

  return contributions.map((contribution) => ({
    id: contribution.id,
    shortId: contribution.id.slice(-8),
    createdAt: contribution.createdAt,
    amountCents: contribution.amountCents,
    paymentStatus: contribution.paymentStatus,
    displayName: contribution.isAnonymous ? "Anonymous" : contribution.publicName ?? "Anonymous",
    isAnonymous: contribution.isAnonymous,
    publicNameHidden: contribution.publicNameHidden,
    refundedAmountCents: contribution.refundedAmountCents,
  }));
}
