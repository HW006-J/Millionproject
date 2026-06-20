import type Stripe from "stripe";
import { PaymentProvider, PaymentStatus } from "@prisma/client";
import { confirmContribution } from "@/lib/confirmContribution";
import { prisma } from "@/lib/prisma";

export async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session,
): Promise<void> {
  const contributionId = session.metadata?.contributionId;
  if (!contributionId) {
    console.warn("checkout.session.completed missing contributionId metadata, session:", session.id);
    return;
  }

  const contribution = await prisma.contribution.findUnique({ where: { id: contributionId } });

  if (!contribution) {
    console.warn("checkout.session.completed: contribution not found:", contributionId);
    return;
  }

  if (contribution.providerSessionId !== session.id) {
    console.warn("checkout.session.completed: session id mismatch for contribution:", contributionId);
    return;
  }

  if (contribution.paymentProvider !== PaymentProvider.STRIPE) {
    console.warn("checkout.session.completed: provider mismatch for contribution:", contributionId);
    return;
  }

  if (contribution.paymentStatus !== PaymentStatus.PENDING) {
    // Already handled — confirmContribution() is idempotent, but skip the
    // extra validation work for a contribution we know isn't pending anymore.
    return;
  }

  if (session.currency !== "usd") {
    console.warn("checkout.session.completed: unexpected currency for contribution:", contributionId);
    return;
  }

  if (session.amount_total !== contribution.amountCents) {
    console.warn("checkout.session.completed: amount mismatch for contribution:", contributionId);
    return;
  }

  if (session.payment_status !== "paid") {
    return;
  }

  await confirmContribution(contributionId, PaymentProvider.STRIPE);

  if (typeof session.payment_intent === "string") {
    await prisma.contribution.update({
      where: { id: contributionId },
      data: { providerPaymentId: session.payment_intent },
    });
  }
}
