import { ContributionSelector } from "@/components/ContributionSelector";
import { MomentumStats } from "@/components/MomentumStats";
import { TotalDisplay } from "@/components/TotalDisplay";

const CONFIRMED_CENTS = 0;
const CONTRIBUTOR_COUNT = 0;
const RAISED_TODAY_CENTS = 0;
const RAISED_LAST_HOUR_CENTS = 0;
const AVERAGE_CONTRIBUTION_CENTS = 0;

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center gap-12 px-6 py-12 sm:gap-16 sm:py-20">
      <header className="text-xs font-semibold uppercase tracking-[0.3em] text-neutral-400">
        ONE MILLION
      </header>

      <TotalDisplay confirmedCents={CONFIRMED_CENTS} />

      <section className="flex flex-col items-center gap-4 text-center">
        <h1 className="max-w-3xl text-3xl font-bold tracking-tight sm:text-5xl">
          $1,000,000. Because why not?
        </h1>
        <p className="max-w-md text-sm text-neutral-400 sm:text-base">
          No cause. No reward. No explanation. Just one ridiculous goal.
        </p>
      </section>

      <ContributionSelector />

      <MomentumStats
        confirmedCents={CONFIRMED_CENTS}
        contributorCount={CONTRIBUTOR_COUNT}
        raisedTodayCents={RAISED_TODAY_CENTS}
        raisedLastHourCents={RAISED_LAST_HOUR_CENTS}
        averageContributionCents={AVERAGE_CONTRIBUTION_CENTS}
      />
    </main>
  );
}
