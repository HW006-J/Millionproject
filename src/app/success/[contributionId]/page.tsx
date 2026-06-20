import { Confetti } from "@/components/Confetti";
import { ProcessingStatus } from "@/components/ProcessingStatus";
import { ShareActions } from "@/components/ShareActions";
import { formatCents } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import { resolveSuccessView } from "@/lib/successView";

export const dynamic = "force-dynamic";

interface SuccessPageProps {
  params: Promise<{ contributionId: string }>;
}

function MessagePage({ message }: { message: string }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 py-12 text-center">
      <p className="text-lg text-neutral-400">{message}</p>
    </main>
  );
}

export default async function SuccessPage({ params }: SuccessPageProps) {
  const { contributionId } = await params;

  const contribution = await prisma.contribution.findUnique({
    where: { id: contributionId },
    include: { campaign: true },
  });

  if (!contribution) {
    return <MessagePage message="We couldn't find that contribution." />;
  }

  const view = resolveSuccessView(contribution);

  if (view === "not_found") {
    return <MessagePage message="We couldn't find that contribution." />;
  }

  if (view === "failed") {
    return <MessagePage message="That payment didn't go through. No charge was made." />;
  }

  if (view === "processing") {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 py-12 text-center">
        <ProcessingStatus contributionId={contributionId} />
      </main>
    );
  }

  const { campaign } = contribution;
  const percent = Math.min(
    100,
    (campaign.confirmedAmountCents / campaign.targetAmountCents) * 100,
  );
  const percentLabel = percent.toFixed(percent > 0 && percent < 1 ? 2 : 0);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const shareUrl = `${appUrl}/success/${contribution.id}`;
  const shareText =
    "I just moved the internet closer to $1,000,000.\nNo cause. No reward. Just the goal.";

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center gap-8 overflow-hidden px-6 py-12 text-center">
      <Confetti />

      <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
        YOU MOVED THE NUMBER.
      </h1>

      <div className="flex flex-col items-center gap-2">
        <p className="text-sm uppercase tracking-[0.2em] text-neutral-400">
          Your contribution
        </p>
        <p className="text-4xl font-bold tabular-nums">
          {formatCents(contribution.amountCents)}
        </p>
      </div>

      <div className="grid w-full max-w-md grid-cols-2 gap-6">
        <div className="flex flex-col gap-1">
          <p className="text-2xl font-semibold tabular-nums">
            {formatCents(campaign.confirmedAmountCents)}
          </p>
          <p className="text-xs uppercase tracking-wide text-neutral-500">
            Updated total
          </p>
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-2xl font-semibold tabular-nums">
            #{contribution.contributorNumber ?? "—"}
          </p>
          <p className="text-xs uppercase tracking-wide text-neutral-500">
            Contributor number
          </p>
        </div>
      </div>

      <p className="text-sm text-neutral-400">
        {percentLabel}% of $1,000,000 reached
      </p>

      <ShareActions shareText={shareText} shareUrl={shareUrl} />
    </main>
  );
}
