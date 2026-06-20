import { PaymentProvider, PaymentStatus } from "@prisma/client";
import { findOrCreatePendingContribution, resolveNonPendingRedirect } from "./shared";
import type { CheckoutInput, CheckoutProvider, CheckoutResult } from "./types";

export class MockCheckoutProvider implements CheckoutProvider {
  async createCheckout(input: CheckoutInput): Promise<CheckoutResult> {
    const contribution = await findOrCreatePendingContribution({
      ...input,
      paymentProvider: PaymentProvider.MOCK,
    });

    if (contribution.paymentStatus !== PaymentStatus.PENDING) {
      return {
        contributionId: contribution.id,
        redirectUrl: resolveNonPendingRedirect(contribution),
      };
    }

    return {
      contributionId: contribution.id,
      redirectUrl: `/mock-checkout/${contribution.id}`,
    };
  }
}
