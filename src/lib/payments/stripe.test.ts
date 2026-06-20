import { beforeEach, describe, expect, it, vi } from "vitest";
import { PaymentProvider, PaymentStatus } from "@prisma/client";
import { StripeCheckoutProvider } from "@/lib/payments/stripe";

const {
  mockFindOrCreate,
  mockResolveNonPendingRedirect,
  mockGetStripeClient,
  mockSessionsCreate,
  mockSessionsRetrieve,
  mockContributionUpdate,
} = vi.hoisted(() => ({
  mockFindOrCreate: vi.fn(),
  mockResolveNonPendingRedirect: vi.fn(),
  mockGetStripeClient: vi.fn(),
  mockSessionsCreate: vi.fn(),
  mockSessionsRetrieve: vi.fn(),
  mockContributionUpdate: vi.fn(),
}));

vi.mock("@/lib/payments/shared", () => ({
  findOrCreatePendingContribution: mockFindOrCreate,
  resolveNonPendingRedirect: mockResolveNonPendingRedirect,
}));

vi.mock("@/lib/stripe", () => ({
  getStripeClient: mockGetStripeClient,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    contribution: { update: mockContributionUpdate },
  },
}));

beforeEach(() => {
  mockFindOrCreate.mockReset();
  mockResolveNonPendingRedirect.mockReset();
  mockGetStripeClient.mockReset();
  mockSessionsCreate.mockReset();
  mockSessionsRetrieve.mockReset();
  mockContributionUpdate.mockReset();
  mockGetStripeClient.mockReturnValue({
    checkout: { sessions: { create: mockSessionsCreate, retrieve: mockSessionsRetrieve } },
  });
});

const baseInput = {
  campaignId: "camp_1",
  amountCents: 500,
  isAnonymous: true,
  publicName: null,
  hideAmountPublicly: false,
  submissionToken: null,
};

const config = { secretKey: "sk_test", webhookSecret: "whsec_test", currency: "usd" };

describe("StripeCheckoutProvider", () => {
  it("creates a Checkout Session with the exact validated USD amount", async () => {
    mockFindOrCreate.mockResolvedValue({
      id: "contrib_1",
      campaignId: "camp_1",
      amountCents: 500,
      paymentStatus: PaymentStatus.PENDING,
      providerSessionId: null,
    });
    mockSessionsCreate.mockResolvedValue({ id: "cs_test_1", url: "https://checkout.stripe.com/cs_test_1" });
    mockContributionUpdate.mockResolvedValue({});

    const provider = new StripeCheckoutProvider(config);
    const result = await provider.createCheckout(baseInput);

    expect(mockFindOrCreate).toHaveBeenCalledWith({
      ...baseInput,
      paymentProvider: PaymentProvider.STRIPE,
    });

    const [sessionParams, options] = mockSessionsCreate.mock.calls[0];
    expect(sessionParams.mode).toBe("payment");
    expect(sessionParams.payment_method_types).toEqual(["card"]);
    expect(sessionParams.line_items[0].price_data.currency).toBe("usd");
    expect(sessionParams.line_items[0].price_data.unit_amount).toBe(500);
    expect(sessionParams.metadata).toEqual({ contributionId: "contrib_1", campaignId: "camp_1" });
    expect(sessionParams.payment_intent_data.metadata).toEqual({ contributionId: "contrib_1" });
    expect(options).toEqual({ idempotencyKey: "checkout_session_contrib_1" });

    expect(mockContributionUpdate).toHaveBeenCalledWith({
      where: { id: "contrib_1" },
      data: { providerSessionId: "cs_test_1" },
    });
    expect(result).toEqual({
      contributionId: "contrib_1",
      redirectUrl: "https://checkout.stripe.com/cs_test_1",
    });
  });

  it("reuses an existing session instead of creating a new one", async () => {
    mockFindOrCreate.mockResolvedValue({
      id: "contrib_1",
      campaignId: "camp_1",
      amountCents: 500,
      paymentStatus: PaymentStatus.PENDING,
      providerSessionId: "cs_existing",
    });
    mockSessionsRetrieve.mockResolvedValue({ url: "https://checkout.stripe.com/cs_existing" });

    const provider = new StripeCheckoutProvider(config);
    const result = await provider.createCheckout(baseInput);

    expect(mockSessionsRetrieve).toHaveBeenCalledWith("cs_existing");
    expect(mockSessionsCreate).not.toHaveBeenCalled();
    expect(result).toEqual({
      contributionId: "contrib_1",
      redirectUrl: "https://checkout.stripe.com/cs_existing",
    });
  });

  it("uses the non-pending redirect when the contribution is no longer pending", async () => {
    mockFindOrCreate.mockResolvedValue({ id: "contrib_1", paymentStatus: PaymentStatus.CONFIRMED });
    mockResolveNonPendingRedirect.mockReturnValue("/success/contrib_1");

    const provider = new StripeCheckoutProvider(config);
    const result = await provider.createCheckout(baseInput);

    expect(mockSessionsCreate).not.toHaveBeenCalled();
    expect(result).toEqual({ contributionId: "contrib_1", redirectUrl: "/success/contrib_1" });
  });
});
