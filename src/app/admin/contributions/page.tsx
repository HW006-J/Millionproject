import { PaymentStatus } from "@prisma/client";
import type { Metadata } from "next";
import Link from "next/link";
import { AdminNav } from "@/components/admin/AdminNav";
import { requireAdmin } from "@/lib/admin/auth";
import { getContributionsPage, parseStatusFilter } from "@/lib/admin/contributions";
import { formatCents } from "@/lib/money";
import { HideNameButton } from "./HideNameButton";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin — Contributions",
  robots: { index: false, follow: false },
};

interface ContributionsPageProps {
  searchParams: Promise<{ status?: string; page?: string }>;
}

const STATUS_FILTERS: Array<{ label: string; value?: PaymentStatus }> = [
  { label: "All" },
  { label: "Pending", value: PaymentStatus.PENDING },
  { label: "Confirmed", value: PaymentStatus.CONFIRMED },
  { label: "Failed", value: PaymentStatus.FAILED },
  { label: "Refunded", value: PaymentStatus.REFUNDED },
];

export default async function AdminContributionsPage({ searchParams }: ContributionsPageProps) {
  // Authorization is checked here, independently of the Proxy and of any layout.
  const admin = await requireAdmin();

  const params = await searchParams;
  const statusFilter = parseStatusFilter(params.status);
  const page = Number.parseInt(params.page ?? "1", 10) || 1;

  const result = await getContributionsPage(page, statusFilter);
  const statusQuery = statusFilter ? `&status=${statusFilter}` : "";

  return (
    <main className="flex min-h-screen flex-col items-center gap-8 px-6 py-12">
      <AdminNav email={admin.email} />

      <div className="flex w-full max-w-4xl flex-col gap-6">
        <h1 className="text-xl font-bold text-white">Contributions</h1>

        <nav className="flex flex-wrap gap-2 text-xs" aria-label="Filter by status">
          {STATUS_FILTERS.map((filter) => {
            const isActive = filter.value === statusFilter;
            const href = filter.value
              ? `/admin/contributions?status=${filter.value}`
              : "/admin/contributions";
            return (
              <Link
                key={filter.label}
                href={href}
                aria-current={isActive ? "page" : undefined}
                className={`rounded-full border px-3 py-1.5 transition-colors ${
                  isActive
                    ? "border-white bg-white text-black"
                    : "border-neutral-700 text-white hover:border-white"
                }`}
              >
                {filter.label}
              </Link>
            );
          })}
        </nav>

        {result.items.length === 0 ? (
          <p className="text-sm text-neutral-500">No contributions match this filter.</p>
        ) : (
          <ul className="flex flex-col gap-2 text-xs">
            {result.items.map((item) => (
              <li
                key={item.id}
                className="flex flex-wrap items-center gap-3 rounded-xl border border-neutral-800 px-3 py-3"
              >
                <span className="font-mono text-neutral-500">#{item.shortId}</span>
                <span className="text-neutral-400">{item.createdAt.toISOString()}</span>
                <span className="font-semibold text-white">{formatCents(item.amountCents)}</span>
                <span className="text-neutral-400">{item.paymentStatus}</span>
                {item.refundedAmountCents > 0 && (
                  <span className="text-neutral-400">
                    refunded {formatCents(item.refundedAmountCents)}
                  </span>
                )}
                <span className="text-neutral-400">
                  {item.displayName}
                  {item.isAnonymous && " (anonymous)"}
                  {item.publicNameHidden && " (hidden from public)"}
                </span>
                {item.contributorNumber !== null && (
                  <span className="text-neutral-500">contributor #{item.contributorNumber}</span>
                )}
                {!item.isAnonymous && (
                  <HideNameButton contributionId={item.id} hidden={item.publicNameHidden} />
                )}
              </li>
            ))}
          </ul>
        )}

        <div className="flex items-center justify-between text-xs text-neutral-400">
          <span>
            Page {result.page} of {result.totalPages} ({result.totalCount} total)
          </span>
          <div className="flex gap-2">
            {result.page > 1 && (
              <Link
                href={`/admin/contributions?page=${result.page - 1}${statusQuery}`}
                className="rounded-full border border-neutral-700 px-3 py-1.5 text-white transition-colors hover:border-white"
              >
                Previous
              </Link>
            )}
            {result.page < result.totalPages && (
              <Link
                href={`/admin/contributions?page=${result.page + 1}${statusQuery}`}
                className="rounded-full border border-neutral-700 px-3 py-1.5 text-white transition-colors hover:border-white"
              >
                Next
              </Link>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
