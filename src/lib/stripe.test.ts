import { afterEach, describe, expect, it, vi } from "vitest";
import { getStripeConfig } from "@/lib/stripe";

describe("getStripeConfig", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns null when STRIPE_SECRET_KEY is missing", () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "");
    vi.stubEnv("STRIPE_WEBHOOK_SECRET", "whsec_test");
    vi.stubEnv("PAYMENT_CURRENCY", "usd");

    expect(getStripeConfig()).toBeNull();
  });

  it("returns null when STRIPE_WEBHOOK_SECRET is missing", () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_123");
    vi.stubEnv("STRIPE_WEBHOOK_SECRET", "");
    vi.stubEnv("PAYMENT_CURRENCY", "usd");

    expect(getStripeConfig()).toBeNull();
  });

  it("returns null when PAYMENT_CURRENCY is not usd", () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_123");
    vi.stubEnv("STRIPE_WEBHOOK_SECRET", "whsec_test");
    vi.stubEnv("PAYMENT_CURRENCY", "gbp");

    expect(getStripeConfig()).toBeNull();
  });

  it("returns a config object when everything is present and valid", () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_123");
    vi.stubEnv("STRIPE_WEBHOOK_SECRET", "whsec_test");
    vi.stubEnv("PAYMENT_CURRENCY", "usd");

    expect(getStripeConfig()).toEqual({
      secretKey: "sk_test_123",
      webhookSecret: "whsec_test",
      currency: "usd",
    });
  });
});
