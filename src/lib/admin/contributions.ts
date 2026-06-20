import { PaymentStatus } from "@prisma/client";
import { CAMPAIGN_SLUG } from "@/lib/campaign";
import { prisma } from "@/lib/prisma";

export const CONTRIBUTIONS_PAGE_SIZE = 20;

export interface ContributionListItem {
  id: string;
  shortId: string;
  createdAt: Date;
  confirmedAt: Date | null;
  amountCents: number;
  paymentStatus: PaymentStatus;
  refundedAmountCents: number;
  displayName: string;
  isAnonymous: boolean;
  publicNameHidden: boolean;
  contributorNumber: number | null;
}

export interface ContributionsPageResult {
  items: ContributionListItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const VALID_STATUSES: string[] = Object.values(PaymentStatus);

export function parseStatusFilter(value: string | undefined): PaymentStatus | undefined {
  if (!value || !VALID_STATUSES.includes(value)) {
    return undefined;
  }
  return value as PaymentStatus;
}

/**
 * Paginated, optionally status-filtered, newest-first contribution list for
 * admin review. Shows the real submitted name (admin audit) — moderation
 * suppression only applies to public-facing output, never this view.
 */
export async function getContributionsPage(
  page: number,
  statusFilter?: PaymentStatus,
): Promise<ContributionsPageResult> {
  const campaign = await prisma.campaign.findUnique({
    where: { slug: CAMPAIGN_SLUG },
    select: { id: true },
  });

  if (!campaign) {
    return { items: [], totalCount: 0, page: 1, pageSize: CONTRIBUTIONS_PAGE_SIZE, totalPages: 0 };
  }

  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  const where = {
    campaignId: campaign.id,
    ...(statusFilter ? { paymentStatus: statusFilter } : {}),
  };

  const [totalCount, rows] = await Promise.all([
    prisma.contribution.count({ where }),
    prisma.contribution.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (safePage - 1) * CONTRIBUTIONS_PAGE_SIZE,
      take: CONTRIBUTIONS_PAGE_SIZE,
      select: {
        id: true,
        createdAt: true,
        confirmedAt: true,
        amountCents: true,
        paymentStatus: true,
        refundedAmountCents: true,
        publicName: true,
        isAnonymous: true,
        publicNameHidden: true,
        contributorNumber: true,
      },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / CONTRIBUTIONS_PAGE_SIZE));

  return {
    items: rows.map((row) => ({
      id: row.id,
      shortId: row.id.slice(-8),
      createdAt: row.createdAt,
      confirmedAt: row.confirmedAt,
      amountCents: row.amountCents,
      paymentStatus: row.paymentStatus,
      refundedAmountCents: row.refundedAmountCents,
      displayName: row.isAnonymous ? "Anonymous" : row.publicName ?? "Anonymous",
      isAnonymous: row.isAnonymous,
      publicNameHidden: row.publicNameHidden,
      contributorNumber: row.contributorNumber,
    })),
    totalCount,
    page: safePage,
    pageSize: CONTRIBUTIONS_PAGE_SIZE,
    totalPages,
  };
}
