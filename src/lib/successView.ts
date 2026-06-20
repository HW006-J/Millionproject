import { PaymentProvider, PaymentStatus } from "@prisma/client";

export type SuccessView = "success" | "processing" | "failed" | "not_found";

export interface SuccessViewInput {
  paymentStatus: PaymentStatus;
  paymentProvider: PaymentProvider;
}

/**
 * Decides what the /success page should show, given only a contribution's
 * status and provider. Never trusts anything from the browser/URL — the
 * caller always re-fetches this from the database.
 */
export function resolveSuccessView(contribution: SuccessViewInput | null): SuccessView {
  if (!contribution) {
    return "not_found";
  }

  if (
    contribution.paymentStatus === PaymentStatus.CONFIRMED ||
    contribution.paymentStatus === PaymentStatus.REFUNDED
  ) {
    return "success";
  }

  if (contribution.paymentStatus === PaymentStatus.FAILED) {
    return "failed";
  }

  // PENDING: Stripe payments can still be waiting on the webhook; mock-mode
  // pending contributions have no async confirmation to wait for.
  if (contribution.paymentProvider === PaymentProvider.STRIPE) {
    return "processing";
  }

  return "not_found";
}
