import { ContributionSelector } from "@/components/ContributionSelector";
import { MomentumStats } from "@/components/MomentumStats";
import { TotalDisplay } from "@/components/TotalDisplay";
import { getCampaignStats } from "@/lib/campaign";

export const dynamic = "force-dynamic";

export default async function Home() {
  const stats = await getCampaignStats();

  return (
    <main className="flex min-h-screen flex-col items-center gap-12 px-6 py-12 sm:gap-16 sm:py-20">
      <header className="text-xs font-semibold uppercase tracking-[0.3em] text-neutral-400">
        ONE MILLION
      </header>

      {stats ? (
        <TotalDisplay
          confirmedCents={stats.confirmedAmountCents}
          targetCents={stats.targetAmountCents}
        />
      ) : (
        <p className="text-sm text-neutral-500">Live total temporarily unavailable.</p>
      )}

      <section className="flex flex-col items-center gap-4 text-center">
        <h1 className="max-w-3xl text-3xl font-bold tracking-tight sm:text-5xl">
          $1,000,000. Because why not?
        </h1>
        <p className="max-w-md text-sm text-neutral-400 sm:text-base">
          No cause. No reward. No explanation. Just one ridiculous goal.
        </p>
      </section>

      <ContributionSelector />

      {stats && (
        <MomentumStats
          confirmedCents={stats.confirmedAmountCents}
          targetCents={stats.targetAmountCents}
          contributorCount={stats.confirmedContributionCount}
          raisedTodayCents={stats.raisedTodayCents}
          raisedLastHourCents={stats.raisedLastHourCents}
          averageContributionCents={stats.averageContributionCents}
        />
      )}
    </main>
  );
}
