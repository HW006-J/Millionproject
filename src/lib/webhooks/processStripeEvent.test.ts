import { beforeEach, describe, expect, it, vi } from "vitest";
import { processStripeEvent } from "@/lib/webhooks/processStripeEvent";

const {
  mockClaim,
  mockMarkProcessed,
  mockMarkFailed,
  mockHandleCheckout,
  mockHandlePaymentFailed,
  mockHandleRefund,
} = vi.hoisted(() => ({
  mockClaim: vi.fn(),
  mockMarkProcessed: vi.fn(),
  mockMarkFailed: vi.fn(),
  mockHandleCheckout: vi.fn(),
  mockHandlePaymentFailed: vi.fn(),
  mockHandleRefund: vi.fn(),
}));

vi.mock("@/lib/webhooks/claimWebhookEvent", () => ({
  claimWebhookEvent: mockClaim,
  markWebhookEventProcessed: mockMarkProcessed,
  markWebhookEventFailed: mockMarkFailed,
}));

vi.mock("@/lib/webhooks/handleCheckoutSessionCompleted", () => ({
  handleCheckoutSessionCompleted: mockHandleCheckout,
}));

vi.mock("@/lib/webhooks/handlePaymentIntentFailed", () => ({
  handlePaymentIntentFailed: mockHandlePaymentFailed,
}));

vi.mock("@/lib/webhooks/handleChargeRefunded", () => ({
  handleChargeRefunded: mockHandleRefund,
}));

beforeEach(() => {
  mockClaim.mockReset();
  mockMarkProcessed.mockReset();
  mockMarkFailed.mockReset();
  mockHandleCheckout.mockReset();
  mockHandlePaymentFailed.mockReset();
  mockHandleRefund.mockReset();
});

function makeEvent(type: string, object: unknown = {}) {
  return { id: "evt_1", type, data: { object } } as never;
}

describe("processStripeEvent", () => {
  it("does nothing when the event was already processed", async () => {
    mockClaim.mockResolvedValue("already_processed");

    await processStripeEvent(makeEvent("checkout.session.completed"));

    expect(mockHandleCheckout).not.toHaveBeenCalled();
    expect(mockMarkProcessed).not.toHaveBeenCalled();
  });

  it("does nothing when another delivery is currently in progress", async () => {
    mockClaim.mockResolvedValue("in_progress");

    await processStripeEvent(makeEvent("checkout.session.completed"));

    expect(mockHandleCheckout).not.toHaveBeenCalled();
  });

  it("dispatches checkout.session.completed and marks the event processed", async () => {
    mockClaim.mockResolvedValue("claimed");
    const session = { id: "cs_1" };

    await processStripeEvent(makeEvent("checkout.session.completed", session));

    expect(mockHandleCheckout).toHaveBeenCalledWith(session);
    expect(mockMarkProcessed).toHaveBeenCalledWith("evt_1");
  });

  it("dispatches payment_intent.payment_failed", async () => {
    mockClaim.mockResolvedValue("claimed");
    const intent = { id: "pi_1" };

    await processStripeEvent(makeEvent("payment_intent.payment_failed", intent));

    expect(mockHandlePaymentFailed).toHaveBeenCalledWith(intent);
    expect(mockMarkProcessed).toHaveBeenCalledWith("evt_1");
  });

  it("dispatches charge.refunded", async () => {
    mockClaim.mockResolvedValue("claimed");
    const charge = { id: "ch_1" };

    await processStripeEvent(makeEvent("charge.refunded", charge));

    expect(mockHandleRefund).toHaveBeenCalledWith(charge);
    expect(mockMarkProcessed).toHaveBeenCalledWith("evt_1");
  });

  it("marks the event failed and rethrows when the handler throws", async () => {
    mockClaim.mockResolvedValue("claimed");
    mockHandleCheckout.mockRejectedValue(new Error("db exploded"));

    await expect(processStripeEvent(makeEvent("checkout.session.completed", {}))).rejects.toThrow(
      "db exploded",
    );
    expect(mockMarkFailed).toHaveBeenCalledWith("evt_1", "db exploded");
    expect(mockMarkProcessed).not.toHaveBeenCalled();
  });

  it("acknowledges unhandled event types without dispatching anything", async () => {
    mockClaim.mockResolvedValue("claimed");

    await processStripeEvent(makeEvent("customer.created", {}));

    expect(mockHandleCheckout).not.toHaveBeenCalled();
    expect(mockHandlePaymentFailed).not.toHaveBeenCalled();
    expect(mockHandleRefund).not.toHaveBeenCalled();
    expect(mockMarkProcessed).toHaveBeenCalledWith("evt_1");
  });
});
