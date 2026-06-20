import { PaymentStatus } from "@prisma/client";
import { CAMPAIGN_SLUG } from "@/lib/campaign";
import { prisma } from "@/lib/prisma";
import { addUTCDays, startOfUTCDay } from "./utc";

export interface DashboardMetrics {
  campaignName: string;
  isActive: boolean;
  currency: string;
  targetAmountCents: number;
  confirmedAmountCents: number;
  remainingCents: number;
  progressPercent: number;
  confirmedContributionCount: number;
  pendingCount: number;
  pendingAmountCents: number;
  failedCount: number;
  failedAmountCents: number;
  totalRefundedCents: number;
  contributionsCreatedToday: number;
  contributionsCreatedLast7Days: number;
  paymentsMode: string | null;
  /**
   * Count of WebhookEvent rows with a recorded failureReason. This is the
   * only webhook-health signal the current schema can derive accurately —
   * a row with no failureReason is never treated as a failure, since that
   * would be inferring failure from an absent field rather than from a
   * persisted fact.
   */
  webhookFailureCount: number;
}

/**
 * All amounts here come either directly from Campaign.confirmedAmountCents
 * (maintained exclusively by confirmContribution/refundContribution — never
 * recomputed here) or from live integer-cent aggregates over Contribution.
 * Day boundaries are UTC.
 */
export async function getDashboardMetrics(): Promise<DashboardMetrics | null> {
  const campaign = await prisma.campaign.findUnique({ where: { slug: CAMPAIGN_SLUG } });
  if (!campaign) {
    return null;
  }

  const now = new Date();
  const todayStart = startOfUTCDay(now);
  const sevenDaysAgoStart = addUTCDays(startOfUTCDay(now), -6); // today + 6 prior days = 7 days

  const [
    pendingAggregate,
    failedAggregate,
    refundedAggregate,
    contributionsCreatedToday,
    contributionsCreatedLast7Days,
    webhookFailureCount,
  ] = await Promise.all([
    prisma.contribution.aggregate({
      where: { campaignId: campaign.id, paymentStatus: PaymentStatus.PENDING },
      _count: { _all: true },
      _sum: { amountCents: true },
    }),
    prisma.contribution.aggregate({
      where: { campaignId: campaign.id, paymentStatus: PaymentStatus.FAILED },
      _count: { _all: true },
      _sum: { amountCents: true },
    }),
    prisma.contribution.aggregate({
      where: { campaignId: campaign.id },
      _sum: { refundedAmountCents: true },
    }),
    prisma.contribution.count({
      where: { campaignId: campaign.id, createdAt: { gte: todayStart } },
    }),
    prisma.contribution.count({
      where: { campaignId: campaign.id, createdAt: { gte: sevenDaysAgoStart } },
    }),
    prisma.webhookEvent.count({ where: { failureReason: { not: null } } }),
  ]);

  const remainingCents = Math.max(0, campaign.targetAmountCents - campaign.confirmedAmountCents);
  const progressPercent =
    campaign.targetAmountCents > 0
      ? Math.min(100, (campaign.confirmedAmountCents / campaign.targetAmountCents) * 100)
      : 0;

  return {
    campaignName: campaign.name,
    isActive: campaign.isActive,
    currency: campaign.currency,
    targetAmountCents: campaign.targetAmountCents,
    confirmedAmountCents: campaign.confirmedAmountCents,
    remainingCents,
    progressPercent,
    confirmedContributionCount: campaign.confirmedContributionCount,
    pendingCount: pendingAggregate._count._all,
    pendingAmountCents: pendingAggregate._sum.amountCents ?? 0,
    failedCount: failedAggregate._count._all,
    failedAmountCents: failedAggregate._sum.amountCents ?? 0,
    totalRefundedCents: refundedAggregate._sum.refundedAmountCents ?? 0,
    contributionsCreatedToday,
    contributionsCreatedLast7Days,
    paymentsMode: process.env.PAYMENTS_MODE ?? null,
    webhookFailureCount,
  };
}
