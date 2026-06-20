import Stripe from "stripe";

export interface StripeConfig {
  secretKey: string;
  webhookSecret: string;
  currency: string;
}

/**
 * Reads and validates the environment variables required to run Stripe mode.
 * Returns null if anything required is missing or invalid — callers must
 * treat that as "Stripe is unavailable" and fail closed, never attempting
 * a Stripe API call with incomplete configuration.
 */
export function getStripeConfig(): StripeConfig | null {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const currency = process.env.PAYMENT_CURRENCY;

  if (!secretKey || !webhookSecret || currency !== "usd") {
    return null;
  }

  return { secretKey, webhookSecret, currency };
}

let cachedClient: Stripe | null = null;
let cachedClientKey: string | null = null;

/**
 * Lazily constructs a Stripe client. Never called at module load time for
 * code paths that run regardless of PAYMENTS_MODE, so a missing
 * STRIPE_SECRET_KEY never crashes mock-mode usage.
 */
export function getStripeClient(config: StripeConfig): Stripe {
  if (cachedClient && cachedClientKey === config.secretKey) {
    return cachedClient;
  }

  cachedClient = new Stripe(config.secretKey);
  cachedClientKey = config.secretKey;
  return cachedClient;
}
