import { MockCheckoutProvider } from "./mock";
import type { CheckoutProvider } from "./types";

export function isMockModeAllowed(): boolean {
  return (
    process.env.PAYMENTS_MODE === "mock" && process.env.NODE_ENV !== "production"
  );
}

export function getCheckoutProvider(): CheckoutProvider | null {
  if (!isMockModeAllowed()) {
    return null;
  }

  return new MockCheckoutProvider();
}
