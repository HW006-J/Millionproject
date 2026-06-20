import { PaymentProvider, PaymentStatus } from "@prisma/client";
import { getStripeClient, type StripeConfig } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { findOrCreatePendingContribution, resolveNonPendingRedirect } from "./shared";
import type { CheckoutInput, CheckoutProvider, CheckoutResult } from "./types";

function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

export class StripeCheckoutProvider implements CheckoutProvider {
  constructor(private readonly config: StripeConfig) {}

  async createCheckout(input: CheckoutInput): Promise<CheckoutResult> {
    const contribution = await findOrCreatePendingContribution({
      ...input,
      paymentProvider: PaymentProvider.STRIPE,
    });

    if (contribution.paymentStatus !== PaymentStatus.PENDING) {
      return {
        contributionId: contribution.id,
        redirectUrl: resolveNonPendingRedirect(contribution),
      };
    }

    const stripe = getStripeClient(this.config);

    if (contribution.providerSessionId) {
      const existingSession = await stripe.checkout.sessions.retrieve(
        contribution.providerSessionId,
      );
      if (existingSession.url) {
        return { contributionId: contribution.id, redirectUrl: existingSession.url };
      }
    }

    const appUrl = getAppUrl();

    const session = await stripe.checkout.sessions.create(
      {
        mode: "payment",
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "usd",
              unit_amount: contribution.amountCents,
              product_data: {
                name: "Contribution to ONE MILLION",
              },
            },
            quantity: 1,
          },
        ],
        success_url: `${appUrl}/success/${contribution.id}`,
        cancel_url: `${appUrl}/`,
        metadata: {
          contributionId: contribution.id,
          campaignId: contribution.campaignId,
        },
        payment_intent_data: {
          metadata: {
            contributionId: contribution.id,
          },
        },
      },
      { idempotencyKey: `checkout_session_${contribution.id}` },
    );

    if (!session.url) {
      throw new Error("Stripe did not return a Checkout Session URL.");
    }

    await prisma.contribution.update({
      where: { id: contribution.id },
      data: { providerSessionId: session.id },
    });

    return { contributionId: contribution.id, redirectUrl: session.url };
  }
}
