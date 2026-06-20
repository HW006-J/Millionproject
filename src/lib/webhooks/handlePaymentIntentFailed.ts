import type Stripe from "stripe";
import { PaymentProvider, PaymentStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function handlePaymentIntentFailed(
  paymentIntent: Stripe.PaymentIntent,
): Promise<void> {
  const contributionId = paymentIntent.metadata?.contributionId;
  if (!contributionId) {
    console.warn(
      "payment_intent.payment_failed missing contributionId metadata, intent:",
      paymentIntent.id,
    );
    return;
  }

  const contribution = await prisma.contribution.findUnique({ where: { id: contributionId } });

  if (!contribution || contribution.paymentProvider !== PaymentProvider.STRIPE) {
    console.warn(
      "payment_intent.payment_failed: contribution not found or provider mismatch:",
      contributionId,
    );
    return;
  }

  if (contribution.paymentStatus !== PaymentStatus.PENDING) {
    // Never overwrite a CONFIRMED/REFUNDED contribution with FAILED.
    return;
  }

  await prisma.contribution.updateMany({
    where: { id: contributionId, paymentStatus: PaymentStatus.PENDING },
    data: { paymentStatus: PaymentStatus.FAILED, providerPaymentId: paymentIntent.id },
  });
}
