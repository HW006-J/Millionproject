import { afterEach, describe, expect, it, vi } from "vitest";
import { getEnvironmentReport } from "@/lib/env";

describe("getEnvironmentReport", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("reports DATABASE_URL as configured when present", () => {
    vi.stubEnv("DATABASE_URL", "postgresql://example");
    const report = getEnvironmentReport();
    expect(report.alwaysRequired).toEqual([{ name: "DATABASE_URL", configured: true }]);
  });

  it("reports DATABASE_URL as not configured when missing", () => {
    vi.stubEnv("DATABASE_URL", "");
    const report = getEnvironmentReport();
    expect(report.alwaysRequired).toEqual([{ name: "DATABASE_URL", configured: false }]);
  });

  it("reports Stripe-mode variables independently, none required for mock mode", () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "");
    vi.stubEnv("STRIPE_WEBHOOK_SECRET", "");
    vi.stubEnv("PAYMENT_CURRENCY", "");
    const report = getEnvironmentReport();
    expect(report.stripeMode).toEqual([
      { name: "STRIPE_SECRET_KEY", configured: false },
      { name: "STRIPE_WEBHOOK_SECRET", configured: false },
      { name: "PAYMENT_CURRENCY", configured: false },
    ]);
  });

  it("reports PAYMENT_CURRENCY as not configured unless it is exactly usd", () => {
    vi.stubEnv("PAYMENT_CURRENCY", "gbp");
    const report = getEnvironmentReport();
    const currency = report.stripeMode.find((v) => v.name === "PAYMENT_CURRENCY");
    expect(currency?.configured).toBe(false);
  });

  it("reports Stripe-mode variables as configured when fully set", () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_123");
    vi.stubEnv("STRIPE_WEBHOOK_SECRET", "whsec_123");
    vi.stubEnv("PAYMENT_CURRENCY", "usd");
    const report = getEnvironmentReport();
    expect(report.stripeMode.every((v) => v.configured)).toBe(true);
  });

  it("reports AUTH_SECRET as not configured when too short", () => {
    vi.stubEnv("AUTH_SECRET", "too-short");
    const report = getEnvironmentReport();
    expect(report.adminAuth).toEqual([{ name: "AUTH_SECRET", configured: false }]);
  });

  it("reports AUTH_SECRET as configured when it meets the minimum length", () => {
    vi.stubEnv("AUTH_SECRET", "a".repeat(32));
    const report = getEnvironmentReport();
    expect(report.adminAuth).toEqual([{ name: "AUTH_SECRET", configured: true }]);
  });

  it("never includes ADMIN_EMAIL or ADMIN_INITIAL_PASSWORD as runtime-required", () => {
    const report = getEnvironmentReport();
    const allNames = [
      ...report.alwaysRequired,
      ...report.stripeMode,
      ...report.adminAuth,
      ...report.optionalLegal,
    ].map((v) => v.name);
    expect(allNames).not.toContain("ADMIN_EMAIL");
    expect(allNames).not.toContain("ADMIN_INITIAL_PASSWORD");
  });

  it("categorizes LEGAL_ENTITY_NAME and CONTACT_EMAIL as optional", () => {
    vi.stubEnv("LEGAL_ENTITY_NAME", "");
    vi.stubEnv("CONTACT_EMAIL", "");
    const report = getEnvironmentReport();
    expect(report.optionalLegal).toEqual([
      { name: "LEGAL_ENTITY_NAME", configured: false },
      { name: "CONTACT_EMAIL", configured: false },
    ]);
  });
});
