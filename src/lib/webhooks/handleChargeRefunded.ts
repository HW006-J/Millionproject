import type Stripe from "stripe";
import { PaymentProvider } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { refundContribution } from "@/lib/refundContribution";

export async function handleChargeRefunded(charge: Stripe.Charge): Promise<void> {
  const paymentIntentId =
    typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id;

  let contributionId: string | undefined = charge.metadata?.contributionId;

  if (!contributionId && paymentIntentId) {
    const contribution = await prisma.contribution.findFirst({
      where: { providerPaymentId: paymentIntentId, paymentProvider: PaymentProvider.STRIPE },
      select: { id: true },
    });
    contributionId = contribution?.id;
  }

  if (!contributionId) {
    console.warn("charge.refunded: could not resolve contribution for charge:", charge.id);
    return;
  }

  const result = await refundContribution(
    contributionId,
    PaymentProvider.STRIPE,
    charge.amount_refunded,
  );

  if (result.status === "not_found" || result.status === "provider_mismatch" || result.status === "not_confirmed") {
    console.warn(`charge.refunded: ${result.status} for contribution:`, contributionId);
  }
}
