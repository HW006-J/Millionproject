import { beforeEach, describe, expect, it, vi } from "vitest";
import { PaymentProvider, PaymentStatus } from "@prisma/client";
import { MockCheckoutProvider } from "@/lib/payments/mock";

const { mockCreate } = vi.hoisted(() => ({ mockCreate: vi.fn() }));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    contribution: {
      create: mockCreate,
    },
  },
}));

beforeEach(() => {
  mockCreate.mockReset();
});

describe("MockCheckoutProvider", () => {
  it("creates a pending contribution using the mock provider", async () => {
    mockCreate.mockResolvedValue({ id: "contrib_1" });

    const provider = new MockCheckoutProvider();
    const result = await provider.createCheckout({
      campaignId: "camp_1",
      amountCents: 500,
      isAnonymous: true,
      publicName: null,
      hideAmountPublicly: false,
    });

    expect(mockCreate).toHaveBeenCalledWith({
      data: {
        campaignId: "camp_1",
        amountCents: 500,
        currency: "usd",
        paymentProvider: PaymentProvider.MOCK,
        paymentStatus: PaymentStatus.PENDING,
        isAnonymous: true,
        publicName: null,
        hideAmountPublicly: false,
      },
    });
    expect(result).toEqual({
      contributionId: "contrib_1",
      redirectUrl: "/mock-checkout/contrib_1",
    });
  });
});
