import { beforeEach, describe, expect, it, vi } from "vitest";
import { PaymentProvider, PaymentStatus } from "@prisma/client";
import { MockCheckoutProvider } from "@/lib/payments/mock";

const { mockFindOrCreate, mockResolveNonPendingRedirect } = vi.hoisted(() => ({
  mockFindOrCreate: vi.fn(),
  mockResolveNonPendingRedirect: vi.fn(),
}));

vi.mock("@/lib/payments/shared", () => ({
  findOrCreatePendingContribution: mockFindOrCreate,
  resolveNonPendingRedirect: mockResolveNonPendingRedirect,
}));

beforeEach(() => {
  mockFindOrCreate.mockReset();
  mockResolveNonPendingRedirect.mockReset();
});

const baseInput = {
  campaignId: "camp_1",
  amountCents: 500,
  isAnonymous: true,
  publicName: null,
  hideAmountPublicly: false,
  submissionToken: null,
};

describe("MockCheckoutProvider", () => {
  it("redirects to the mock checkout page for a newly created pending contribution", async () => {
    mockFindOrCreate.mockResolvedValue({ id: "contrib_1", paymentStatus: PaymentStatus.PENDING });

    const provider = new MockCheckoutProvider();
    const result = await provider.createCheckout(baseInput);

    expect(mockFindOrCreate).toHaveBeenCalledWith({
      ...baseInput,
      paymentProvider: PaymentProvider.MOCK,
    });
    expect(result).toEqual({
      contributionId: "contrib_1",
      redirectUrl: "/mock-checkout/contrib_1",
    });
    expect(mockResolveNonPendingRedirect).not.toHaveBeenCalled();
  });

  it("uses the non-pending redirect when a duplicate submission already resolved", async () => {
    mockFindOrCreate.mockResolvedValue({ id: "contrib_1", paymentStatus: PaymentStatus.CONFIRMED });
    mockResolveNonPendingRedirect.mockReturnValue("/success/contrib_1");

    const provider = new MockCheckoutProvider();
    const result = await provider.createCheckout(baseInput);

    expect(result).toEqual({ contributionId: "contrib_1", redirectUrl: "/success/contrib_1" });
  });
});
