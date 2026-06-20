import { getAuthSecret } from "@/lib/admin/session";

/**
 * Centralized, server-only environment categorization and validation.
 *
 * This does not replace or weaken the existing fail-closed checks
 * (getStripeConfig(), getAuthSecret(), isMockModeAllowed()) — those remain
 * the actual gates for Stripe calls and admin sessions. This module exists
 * to (a) document which variables genuinely belong in which category, and
 * (b) give tests and operators one place to check configuration status
 * without ever exposing a value.
 */

export interface VariableStatus {
  name: string;
  configured: boolean;
}

export interface EnvironmentReport {
  /** Every supported mode genuinely requires these. */
  alwaysRequired: VariableStatus[];
  /** Only needed when PAYMENTS_MODE=stripe; mock mode must work without them. */
  stripeMode: VariableStatus[];
  /** Only needed for admin login/session signing. */
  adminAuth: VariableStatus[];
  /** Never required to start the app — missing values render as placeholders. */
  optionalLegal: VariableStatus[];
}

export function getEnvironmentReport(): EnvironmentReport {
  return {
    alwaysRequired: [
      { name: "DATABASE_URL", configured: Boolean(process.env.DATABASE_URL) },
    ],
    stripeMode: [
      { name: "STRIPE_SECRET_KEY", configured: Boolean(process.env.STRIPE_SECRET_KEY) },
      { name: "STRIPE_WEBHOOK_SECRET", configured: Boolean(process.env.STRIPE_WEBHOOK_SECRET) },
      { name: "PAYMENT_CURRENCY", configured: process.env.PAYMENT_CURRENCY === "usd" },
    ],
    adminAuth: [{ name: "AUTH_SECRET", configured: getAuthSecret() !== null }],
    optionalLegal: [
      { name: "LEGAL_ENTITY_NAME", configured: Boolean(process.env.LEGAL_ENTITY_NAME?.trim()) },
      { name: "CONTACT_EMAIL", configured: Boolean(process.env.CONTACT_EMAIL?.trim()) },
    ],
  };
}

