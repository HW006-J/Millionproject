import { PaymentProvider, PaymentStatus } from "@prisma/client";
import { notFound } from "next/navigation";
import { formatCents } from "@/lib/money";
import { isMockModeAllowed } from "@/lib/payments";
import { prisma } from "@/lib/prisma";
import { confirmMockContribution } from "../actions";

export const dynamic = "force-dynamic";

interface MockCheckoutPageProps {
  params: Promise<{ contributionId: string }>;
}

export default async function MockCheckoutPage({ params }: MockCheckoutPageProps) {
  if (!isMockModeAllowed()) {
    notFound();
  }

  const { contributionId } = await params;

  const contribution = await prisma.contribution.findUnique({
    where: { id: contributionId },
  });

  if (
    !contribution ||
    contribution.paymentProvider !== PaymentProvider.MOCK ||
    contribution.paymentStatus !== PaymentStatus.PENDING
  ) {
    notFound();
  }

  const displayName = contribution.isAnonymous
    ? "Anonymous"
    : contribution.publicName ?? "Anonymous";

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 px-6 py-12 text-center">
      <p className="rounded-full border border-neutral-700 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400">
        Test mode — no real payment
      </p>

      <div className="flex flex-col items-center gap-2">
        <p className="text-5xl font-bold tabular-nums">
          {formatCents(contribution.amountCents)}
        </p>
        <p className="text-sm text-neutral-400">Showing as: {displayName}</p>
        {contribution.hideAmountPublicly && (
          <p className="text-xs text-neutral-500">
            Your amount will be hidden when shared.
          </p>
        )}
      </div>

      <form action={confirmMockContribution}>
        <input type="hidden" name="contributionId" value={contribution.id} />
        <button
          type="submit"
          className="rounded-full bg-white px-8 py-4 text-base font-semibold tracking-wide text-black transition-opacity hover:opacity-90"
        >
          Simulate successful payment
        </button>
      </form>
    </main>
  );
}
