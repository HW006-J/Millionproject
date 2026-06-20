import { getStripeConfig } from "@/lib/stripe";
import { MockCheckoutProvider } from "./mock";
import { StripeCheckoutProvider } from "./stripe";
import type { CheckoutProvider } from "./types";

export function isMockModeAllowed(): boolean {
  return (
    process.env.PAYMENTS_MODE === "mock" && process.env.NODE_ENV !== "production"
  );
}

/**
 * Returns the active checkout provider, or null if none is safely available.
 * Fails closed: Stripe mode never attempts a Stripe API call unless its full
 * configuration (secret key, webhook secret, USD currency) is present.
 */
export function getCheckoutProvider(): CheckoutProvider | null {
  const mode = process.env.PAYMENTS_MODE;

  if (mode === "mock") {
    return isMockModeAllowed() ? new MockCheckoutProvider() : null;
  }

  if (mode === "stripe") {
    const config = getStripeConfig();
    return config ? new StripeCheckoutProvider(config) : null;
  }

  return null;
}
