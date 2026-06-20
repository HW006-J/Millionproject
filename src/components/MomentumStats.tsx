import { TARGET_CENTS, formatCents } from "@/lib/money";

interface MomentumStatsProps {
  confirmedCents: number;
  contributorCount: number;
  raisedTodayCents: number;
  raisedLastHourCents: number;
  averageContributionCents: number;
}

export function MomentumStats({
  confirmedCents,
  contributorCount,
  raisedTodayCents,
  raisedLastHourCents,
  averageContributionCents,
}: MomentumStatsProps) {
  const remainingCents = Math.max(0, TARGET_CENTS - confirmedCents);

  const stats = [
    { label: "Contributors", value: contributorCount.toLocaleString("en-US") },
    { label: "Raised today", value: formatCents(raisedTodayCents) },
    { label: "Raised in the last hour", value: formatCents(raisedLastHourCents) },
    { label: "Average contribution", value: formatCents(averageContributionCents) },
    { label: "Remaining to goal", value: formatCents(remainingCents) },
  ];

  return (
    <dl className="grid w-full max-w-2xl grid-cols-2 gap-x-6 gap-y-8 text-center sm:grid-cols-5">
      {stats.map((stat) => (
        <div key={stat.label} className="flex flex-col-reverse gap-1">
          <dt className="text-xs uppercase tracking-wide text-neutral-500">
            {stat.label}
          </dt>
          <dd className="text-xl font-semibold tabular-nums">{stat.value}</dd>
        </div>
      ))}
    </dl>
  );
}
