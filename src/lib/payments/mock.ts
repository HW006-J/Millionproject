import { PaymentProvider, PaymentStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { CheckoutInput, CheckoutProvider, CheckoutResult } from "./types";

export class MockCheckoutProvider implements CheckoutProvider {
  async createCheckout(input: CheckoutInput): Promise<CheckoutResult> {
    const contribution = await prisma.contribution.create({
      data: {
        campaignId: input.campaignId,
        amountCents: input.amountCents,
        currency: "usd",
        paymentProvider: PaymentProvider.MOCK,
        paymentStatus: PaymentStatus.PENDING,
        isAnonymous: input.isAnonymous,
        publicName: input.publicName,
        hideAmountPublicly: input.hideAmountPublicly,
      },
    });

    return {
      contributionId: contribution.id,
      redirectUrl: `/mock-checkout/${contribution.id}`,
    };
  }
}
