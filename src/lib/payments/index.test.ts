import { afterEach, describe, expect, it, vi } from "vitest";
import { getCheckoutProvider, isMockModeAllowed } from "@/lib/payments";
import { MockCheckoutProvider } from "@/lib/payments/mock";
import { StripeCheckoutProvider } from "@/lib/payments/stripe";

describe("isMockModeAllowed", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("allows mock mode outside production", () => {
    vi.stubEnv("PAYMENTS_MODE", "mock");
    vi.stubEnv("NODE_ENV", "development");
    expect(isMockModeAllowed()).toBe(true);
  });

  it("blocks mock mode in production", () => {
    vi.stubEnv("PAYMENTS_MODE", "mock");
    vi.stubEnv("NODE_ENV", "production");
    expect(isMockModeAllowed()).toBe(false);
  });

  it("blocks mock mode when PAYMENTS_MODE is not mock", () => {
    vi.stubEnv("PAYMENTS_MODE", "stripe");
    vi.stubEnv("NODE_ENV", "development");
    expect(isMockModeAllowed()).toBe(false);
  });
});

describe("getCheckoutProvider", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns a MockCheckoutProvider when mock mode is allowed", () => {
    vi.stubEnv("PAYMENTS_MODE", "mock");
    vi.stubEnv("NODE_ENV", "development");
    expect(getCheckoutProvider()).toBeInstanceOf(MockCheckoutProvider);
  });

  it("returns null for mock mode in production", () => {
    vi.stubEnv("PAYMENTS_MODE", "mock");
    vi.stubEnv("NODE_ENV", "production");
    expect(getCheckoutProvider()).toBeNull();
  });

  it("returns a StripeCheckoutProvider when stripe mode is fully configured", () => {
    vi.stubEnv("PAYMENTS_MODE", "stripe");
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_123");
    vi.stubEnv("STRIPE_WEBHOOK_SECRET", "whsec_test");
    vi.stubEnv("PAYMENT_CURRENCY", "usd");
    expect(getCheckoutProvider()).toBeInstanceOf(StripeCheckoutProvider);
  });

  it("fails closed for stripe mode when configuration is missing", () => {
    vi.stubEnv("PAYMENTS_MODE", "stripe");
    vi.stubEnv("STRIPE_SECRET_KEY", "");
    vi.stubEnv("STRIPE_WEBHOOK_SECRET", "");
    vi.stubEnv("PAYMENT_CURRENCY", "");
    expect(getCheckoutProvider()).toBeNull();
  });

  it("returns null when PAYMENTS_MODE is unset or unrecognized", () => {
    vi.stubEnv("PAYMENTS_MODE", "");
    expect(getCheckoutProvider()).toBeNull();
  });
});
