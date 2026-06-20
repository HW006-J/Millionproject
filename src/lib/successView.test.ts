import { describe, expect, it } from "vitest";
import { PaymentProvider, PaymentStatus } from "@prisma/client";
import { resolveSuccessView } from "@/lib/successView";

describe("resolveSuccessView", () => {
  it("returns not_found for a missing contribution", () => {
    expect(resolveSuccessView(null)).toBe("not_found");
  });

  it("returns success for a confirmed contribution", () => {
    expect(
      resolveSuccessView({
        paymentStatus: PaymentStatus.CONFIRMED,
        paymentProvider: PaymentProvider.STRIPE,
      }),
    ).toBe("success");
  });

  it("returns success for a refunded contribution (it did genuinely happen)", () => {
    expect(
      resolveSuccessView({
        paymentStatus: PaymentStatus.REFUNDED,
        paymentProvider: PaymentProvider.STRIPE,
      }),
    ).toBe("success");
  });

  it("returns failed for a failed contribution", () => {
    expect(
      resolveSuccessView({
        paymentStatus: PaymentStatus.FAILED,
        paymentProvider: PaymentProvider.STRIPE,
      }),
    ).toBe("failed");
  });

  it("returns processing for a pending Stripe contribution, never trusting a browser-supplied status", () => {
    expect(
      resolveSuccessView({
        paymentStatus: PaymentStatus.PENDING,
        paymentProvider: PaymentProvider.STRIPE,
      }),
    ).toBe("processing");
  });

  it("returns not_found for a pending mock contribution (no async confirmation to wait for)", () => {
    expect(
      resolveSuccessView({
        paymentStatus: PaymentStatus.PENDING,
        paymentProvider: PaymentProvider.MOCK,
      }),
    ).toBe("not_found");
  });
});
