import type { Metadata } from "next";
import Link from "next/link";
import { ActivityChart } from "@/components/admin/ActivityChart";
import { AdminNav } from "@/components/admin/AdminNav";
import { MetricCard } from "@/components/admin/MetricCard";
import { getRecentContributions } from "@/lib/admin/activity";
import { requireAdmin } from "@/lib/admin/auth";
import { getDailyActivity, getHourlyActivity } from "@/lib/admin/charts";
import { getDashboardMetrics } from "@/lib/admin/dashboard";
import { formatCents } from "@/lib/money";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin dashboard",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  // Authorization is checked here, independently of the Proxy and of any
  // layout — this is the real security boundary for this page.
  const admin = await requireAdmin();

  const [metrics, recentContributions, dailyActivity, hourlyActivity] = await Promise.all([
    getDashboardMetrics(),
    getRecentContributions(10),
    getDailyActivity(7),
    getHourlyActivity(24),
  ]);

  if (!metrics) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 py-12 text-center">
        <p className="text-sm text-neutral-400">Campaign data is not available.</p>
      </main>
    );
  }

  const progressLabel = `${metrics.progressPercent.toFixed(metrics.progressPercent > 0 && metrics.progressPercent < 1 ? 2 : 1)}%`;

  return (
    <main className="flex min-h-screen flex-col items-center gap-8 px-6 py-12">
      <AdminNav email={admin.email} />

      <div className="flex w-full max-w-4xl flex-col gap-8">
        <section
          className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-sm ${
            metrics.isActive
              ? "border-neutral-800 text-neutral-400"
              : "border-white bg-white/5 text-white"
          }`}
        >
          <span className="font-semibold">
            Campaign is {metrics.isActive ? "ACTIVE" : "PAUSED"}
          </span>
          <span className="text-neutral-500">
            Payment mode: {metrics.paymentsMode ?? "unset"} · Currency:{" "}
            {metrics.currency.toUpperCase()}
          </span>
        </section>

        <section aria-label="Campaign totals" className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <MetricCard label="Confirmed amount" value={formatCents(metrics.confirmedAmountCents)} />
          <MetricCard label="Remaining to target" value={formatCents(metrics.remainingCents)} />
          <MetricCard label="Progress" value={progressLabel} />
          <MetricCard
            label="Confirmed contributions"
            value={metrics.confirmedContributionCount.toLocaleString("en-US")}
            sublabel="Lifetime count, used for contributor numbering"
          />
          <MetricCard
            label="Pending"
            value={metrics.pendingCount.toLocaleString("en-US")}
            sublabel={`${formatCents(metrics.pendingAmountCents)} not yet confirmed`}
          />
          <MetricCard
            label="Failed"
            value={metrics.failedCount.toLocaleString("en-US")}
            sublabel={`${formatCents(metrics.failedAmountCents)} never charged`}
          />
          <MetricCard label="Total refunded" value={formatCents(metrics.totalRefundedCents)} />
          <MetricCard
            label="Created today"
            value={metrics.contributionsCreatedToday.toLocaleString("en-US")}
            sublabel="Any status, UTC day"
          />
          <MetricCard
            label="Created last 7 days"
            value={metrics.contributionsCreatedLast7Days.toLocaleString("en-US")}
            sublabel="Any status, UTC"
          />
          <MetricCard
            label="Webhook failures recorded"
            value={metrics.webhookFailureCount.toLocaleString("en-US")}
            sublabel="Only counts events with a recorded failure reason"
          />
        </section>

        <ActivityChart title="Daily confirmed activity" unitLabel="last 7 UTC days" buckets={dailyActivity} />
        <ActivityChart title="Hourly confirmed activity" unitLabel="last 24 UTC hours" buckets={hourlyActivity} />

        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-400">
              Recent activity
            </h2>
            <div className="flex gap-4">
              <a href="/admin/export" className="text-xs text-neutral-400 hover:underline">
                Export CSV ↓
              </a>
              <Link href="/admin/contributions" className="text-xs text-neutral-400 hover:underline">
                View all contributions →
              </Link>
            </div>
          </div>

          {recentContributions.length === 0 ? (
            <p className="text-sm text-neutral-500">No contributions yet.</p>
          ) : (
            <ul className="flex flex-col gap-2 text-xs">
              {recentContributions.map((item) => (
                <li
                  key={item.id}
                  className="flex flex-wrap items-center gap-3 rounded-xl border border-neutral-800 px-3 py-2"
                >
                  <span className="font-mono text-neutral-500">#{item.shortId}</span>
                  <span className="text-neutral-400">{item.createdAt.toISOString()}</span>
                  <span className="font-semibold text-white">{formatCents(item.amountCents)}</span>
                  <span className="text-neutral-400">{item.paymentStatus}</span>
                  <span className="text-neutral-400">
                    {item.displayName}
                    {item.isAnonymous && " (anonymous)"}
                    {item.publicNameHidden && " (hidden from public)"}
                  </span>
                  {item.refundedAmountCents > 0 && (
                    <span className="text-neutral-400">
                      refunded {formatCents(item.refundedAmountCents)}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
