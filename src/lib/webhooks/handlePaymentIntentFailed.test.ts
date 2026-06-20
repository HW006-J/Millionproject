import { beforeEach, describe, expect, it, vi } from "vitest";
import { PaymentProvider, PaymentStatus } from "@prisma/client";
import { handlePaymentIntentFailed } from "@/lib/webhooks/handlePaymentIntentFailed";

const { mockFindUnique, mockUpdateMany } = vi.hoisted(() => ({
  mockFindUnique: vi.fn(),
  mockUpdateMany: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    contribution: { findUnique: mockFindUnique, updateMany: mockUpdateMany },
  },
}));

beforeEach(() => {
  mockFindUnique.mockReset();
  mockUpdateMany.mockReset();
});

function paymentIntent(overrides: Record<string, unknown> = {}) {
  return { id: "pi_1", metadata: { contributionId: "contrib_1" }, ...overrides } as never;
}

describe("handlePaymentIntentFailed", () => {
  it("marks a pending contribution as FAILED without touching campaign totals", async () => {
    mockFindUnique.mockResolvedValue({
      id: "contrib_1",
      paymentProvider: PaymentProvider.STRIPE,
      paymentStatus: PaymentStatus.PENDING,
    });
    mockUpdateMany.mockResolvedValue({ count: 1 });

    await handlePaymentIntentFailed(paymentIntent());

    expect(mockUpdateMany).toHaveBeenCalledWith({
      where: { id: "contrib_1", paymentStatus: PaymentStatus.PENDING },
      data: { paymentStatus: PaymentStatus.FAILED, providerPaymentId: "pi_1" },
    });
  });

  it("does nothing without a contributionId in metadata", async () => {
    await handlePaymentIntentFailed(paymentIntent({ metadata: {} }));
    expect(mockUpdateMany).not.toHaveBeenCalled();
  });

  it("does nothing when the contribution cannot be found", async () => {
    mockFindUnique.mockResolvedValue(null);
    await handlePaymentIntentFailed(paymentIntent());
    expect(mockUpdateMany).not.toHaveBeenCalled();
  });

  it("does nothing when the provider does not match", async () => {
    mockFindUnique.mockResolvedValue({
      id: "contrib_1",
      paymentProvider: PaymentProvider.MOCK,
      paymentStatus: PaymentStatus.PENDING,
    });
    await handlePaymentIntentFailed(paymentIntent());
    expect(mockUpdateMany).not.toHaveBeenCalled();
  });

  it("never overwrites an already-confirmed contribution", async () => {
    mockFindUnique.mockResolvedValue({
      id: "contrib_1",
      paymentProvider: PaymentProvider.STRIPE,
      paymentStatus: PaymentStatus.CONFIRMED,
    });
    await handlePaymentIntentFailed(paymentIntent());
    expect(mockUpdateMany).not.toHaveBeenCalled();
  });
});
