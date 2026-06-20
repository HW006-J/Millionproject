import { beforeEach, describe, expect, it, vi } from "vitest";
import { PaymentProvider } from "@prisma/client";
import { handleChargeRefunded } from "@/lib/webhooks/handleChargeRefunded";

const { mockFindFirst, mockRefundContribution } = vi.hoisted(() => ({
  mockFindFirst: vi.fn(),
  mockRefundContribution: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    contribution: { findFirst: mockFindFirst },
  },
}));

vi.mock("@/lib/refundContribution", () => ({
  refundContribution: mockRefundContribution,
}));

beforeEach(() => {
  mockFindFirst.mockReset();
  mockRefundContribution.mockReset();
});

function charge(overrides: Record<string, unknown> = {}) {
  return {
    id: "ch_1",
    amount_refunded: 500,
    payment_intent: "pi_1",
    metadata: { contributionId: "contrib_1" },
    ...overrides,
  } as never;
}

describe("handleChargeRefunded", () => {
  it("resolves the contribution from charge metadata directly", async () => {
    mockRefundContribution.mockResolvedValue({ status: "applied", contributionId: "contrib_1", deltaCents: 500 });

    await handleChargeRefunded(charge());

    expect(mockFindFirst).not.toHaveBeenCalled();
    expect(mockRefundContribution).toHaveBeenCalledWith("contrib_1", PaymentProvider.STRIPE, 500);
  });

  it("falls back to looking up by providerPaymentId when metadata is missing", async () => {
    mockFindFirst.mockResolvedValue({ id: "contrib_2" });
    mockRefundContribution.mockResolvedValue({ status: "applied", contributionId: "contrib_2", deltaCents: 500 });

    await handleChargeRefunded(charge({ metadata: {} }));

    expect(mockFindFirst).toHaveBeenCalledWith({
      where: { providerPaymentId: "pi_1", paymentProvider: PaymentProvider.STRIPE },
      select: { id: true },
    });
    expect(mockRefundContribution).toHaveBeenCalledWith("contrib_2", PaymentProvider.STRIPE, 500);
  });

  it("does nothing when no contribution can be resolved at all", async () => {
    mockFindFirst.mockResolvedValue(null);

    await handleChargeRefunded(charge({ metadata: {} }));

    expect(mockRefundContribution).not.toHaveBeenCalled();
  });
});
