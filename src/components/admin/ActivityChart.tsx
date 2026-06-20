import type { ActivityBucket } from "@/lib/admin/charts";
import { formatCents } from "@/lib/money";

interface ActivityChartProps {
  title: string;
  unitLabel: string;
  buckets: ActivityBucket[];
}

/**
 * A simple accessible bar list (no charting library): each row carries its
 * own real text label with both the contribution count and the confirmed
 * amount, so the numbers are readable even without the visual bar. Safe for
 * an entirely empty dataset, and never divides by zero.
 */
export function ActivityChart({ title, unitLabel, buckets }: ActivityChartProps) {
  const maxCount = Math.max(0, ...buckets.map((bucket) => bucket.count));
  const isEmpty = buckets.every((bucket) => bucket.count === 0);

  return (
    <section aria-label={`${title} (${unitLabel})`} className="flex w-full flex-col gap-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-400">
        {title} <span className="text-neutral-600">({unitLabel})</span>
      </h2>

      {isEmpty ? (
        <p className="text-sm text-neutral-500">No confirmed contributions in this range yet.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {buckets.map((bucket) => {
            const widthPercent = maxCount > 0 ? (bucket.count / maxCount) * 100 : 0;
            return (
              <li key={bucket.label} className="flex items-center gap-3 text-xs">
                <span className="w-14 shrink-0 text-neutral-500">{bucket.label}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-neutral-800">
                  <div
                    className="h-full rounded-full bg-white"
                    style={{ width: `${widthPercent}%` }}
                  />
                </div>
                <span className="w-44 shrink-0 text-right text-neutral-400">
                  {bucket.count} contribution{bucket.count === 1 ? "" : "s"} ·{" "}
                  {formatCents(bucket.amountCents)}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
