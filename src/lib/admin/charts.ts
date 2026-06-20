import { PaymentStatus } from "@prisma/client";
import { CAMPAIGN_SLUG } from "@/lib/campaign";
import { prisma } from "@/lib/prisma";
import { addUTCDays, addUTCHours, startOfUTCDay, startOfUTCHour } from "./utc";

export interface ActivityBucket {
  label: string;
  count: number;
  amountCents: number;
}

/**
 * Daily confirmed-contribution activity for the last `days` UTC days
 * (including today). Buckets are built in application code from a single
 * real-row fetch — not invented data — and always cover the full range
 * (count 0 / amountCents 0) even with no contributions at all.
 */
export async function getDailyActivity(days = 7): Promise<ActivityBucket[]> {
  const campaign = await prisma.campaign.findUnique({
    where: { slug: CAMPAIGN_SLUG },
    select: { id: true },
  });
  if (!campaign) {
    return [];
  }

  const now = new Date();
  const rangeStart = addUTCDays(startOfUTCDay(now), -(days - 1));

  const confirmed = await prisma.contribution.findMany({
    where: {
      campaignId: campaign.id,
      paymentStatus: PaymentStatus.CONFIRMED,
      confirmedAt: { gte: rangeStart },
    },
    select: { confirmedAt: true, amountCents: true },
  });

  const buckets: ActivityBucket[] = [];
  for (let i = 0; i < days; i++) {
    const bucketStart = addUTCDays(rangeStart, i);
    const bucketEnd = addUTCDays(bucketStart, 1);

    const inBucket = confirmed.filter(
      (c) => c.confirmedAt && c.confirmedAt >= bucketStart && c.confirmedAt < bucketEnd,
    );

    buckets.push({
      label: bucketStart.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        timeZone: "UTC",
      }),
      count: inBucket.length,
      amountCents: inBucket.reduce((sum, c) => sum + c.amountCents, 0),
    });
  }

  return buckets;
}

/**
 * Hourly confirmed-contribution activity for the last `hours` UTC hours
 * (including the current, in-progress hour). Same empty-range-safe
 * bucketing approach as getDailyActivity.
 */
export async function getHourlyActivity(hours = 24): Promise<ActivityBucket[]> {
  const campaign = await prisma.campaign.findUnique({
    where: { slug: CAMPAIGN_SLUG },
    select: { id: true },
  });
  if (!campaign) {
    return [];
  }

  const now = new Date();
  const rangeStart = addUTCHours(startOfUTCHour(now), -(hours - 1));

  const confirmed = await prisma.contribution.findMany({
    where: {
      campaignId: campaign.id,
      paymentStatus: PaymentStatus.CONFIRMED,
      confirmedAt: { gte: rangeStart },
    },
    select: { confirmedAt: true, amountCents: true },
  });

  const buckets: ActivityBucket[] = [];
  for (let i = 0; i < hours; i++) {
    const bucketStart = addUTCHours(rangeStart, i);
    const bucketEnd = addUTCHours(bucketStart, 1);

    const inBucket = confirmed.filter(
      (c) => c.confirmedAt && c.confirmedAt >= bucketStart && c.confirmedAt < bucketEnd,
    );

    buckets.push({
      label: `${String(bucketStart.getUTCHours()).padStart(2, "0")}:00`,
      count: inBucket.length,
      amountCents: inBucket.reduce((sum, c) => sum + c.amountCents, 0),
    });
  }

  return buckets;
}
