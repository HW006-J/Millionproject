import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";
import { CAMPAIGN_SLUG } from "@/lib/campaign";
import { buildCsv } from "@/lib/csv";
import { formatCents } from "@/lib/money";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const CSV_HEADERS = [
  "Contribution ID",
  "Created At (UTC)",
  "Confirmed At (UTC)",
  "Status",
  "Amount",
  "Refunded Amount",
  "Display Name",
  "Anonymous",
  "Public Name Hidden",
  "Contributor Number",
];

/**
 * Admin-only CSV export. Never includes Stripe provider/session IDs,
 * password hashes, session values, or any secret — PROJECT_SPEC.md doesn't
 * require provider IDs here, and they aren't genuinely necessary for this
 * operational export (amount + timestamps + status are enough to
 * reconcile by, without widening what's exported beyond what's needed).
 */
export async function GET() {
  // Server-side authorization, independent of Proxy or any layout. Returns
  // a redirect (no CSV body at all) rather than any data for unauthenticated
  // requests.
  await requireAdmin();

  const campaign = await prisma.campaign.findUnique({
    where: { slug: CAMPAIGN_SLUG },
    select: { id: true },
  });

  if (!campaign) {
    return NextResponse.json({ error: "Campaign not found." }, { status: 404 });
  }

  const contributions = await prisma.contribution.findMany({
    where: { campaignId: campaign.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      createdAt: true,
      confirmedAt: true,
      paymentStatus: true,
      amountCents: true,
      refundedAmountCents: true,
      publicName: true,
      isAnonymous: true,
      publicNameHidden: true,
      contributorNumber: true,
    },
  });

  // Shows the real submitted name (subject only to the contributor's own
  // anonymous choice) — this export is admin-only, never public, so the
  // publicNameHidden suppression rule (which governs public-facing output
  // like getShareData) doesn't apply here. The flag is exported as its own
  // column instead, exactly as the spec asks for both fields.
  const rows = contributions.map((contribution) => [
    contribution.id,
    contribution.createdAt.toISOString(),
    contribution.confirmedAt ? contribution.confirmedAt.toISOString() : "",
    contribution.paymentStatus,
    formatCents(contribution.amountCents),
    formatCents(contribution.refundedAmountCents),
    contribution.isAnonymous ? "Anonymous" : contribution.publicName ?? "Anonymous",
    contribution.isAnonymous ? "true" : "false",
    contribution.publicNameHidden ? "true" : "false",
    contribution.contributorNumber ?? "",
  ]);

  const csv = buildCsv(CSV_HEADERS, rows);

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="one-million-contributions.csv"',
      "Cache-Control": "no-store",
    },
  });
}
