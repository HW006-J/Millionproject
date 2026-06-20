import { PaymentStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const CAMPAIGN_SLUG = "one-million";

export interface CampaignStats {
  name: string;
  targetAmountCents: number;
  confirmedAmountCents: number;
  confirmedContributionCount: number;
  raisedTodayCents: number;
  raisedLastHourCents: number;
  averageContributionCents: number;
}

export async function getCampaignStats(): Promise<CampaignStats | null> {
  try {
    const campaign = await prisma.campaign.findUnique({
      where: { slug: CAMPAIGN_SLUG },
    });

    if (!campaign) {
      return null;
    }

    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    const [raisedToday, raisedLastHour] = await Promise.all([
      prisma.contribution.aggregate({
        where: {
          campaignId: campaign.id,
          paymentStatus: PaymentStatus.CONFIRMED,
          confirmedAt: { gte: startOfDay },
        },
        _sum: { amountCents: true },
      }),
      prisma.contribution.aggregate({
        where: {
          campaignId: campaign.id,
          paymentStatus: PaymentStatus.CONFIRMED,
          confirmedAt: { gte: oneHourAgo },
        },
        _sum: { amountCents: true },
      }),
    ]);

    const averageContributionCents =
      campaign.confirmedContributionCount > 0
        ? Math.round(
            campaign.confirmedAmountCents / campaign.confirmedContributionCount,
          )
        : 0;

    return {
      name: campaign.name,
      targetAmountCents: campaign.targetAmountCents,
      confirmedAmountCents: campaign.confirmedAmountCents,
      confirmedContributionCount: campaign.confirmedContributionCount,
      raisedTodayCents: raisedToday._sum.amountCents ?? 0,
      raisedLastHourCents: raisedLastHour._sum.amountCents ?? 0,
      averageContributionCents,
    };
  } catch (error) {
    console.error("Failed to load campaign stats:", error);
    return null;
  }
}
