import { beforeEach, describe, expect, it, vi } from "vitest";
import { PaymentProvider, PaymentStatus } from "@prisma/client";
import { handleCheckoutSessionCompleted } from "@/lib/webhooks/handleCheckoutSessionCompleted";

const { mockFindUnique, mockUpdate, mockConfirmContribution } = vi.hoisted(() => ({
  mockFindUnique: vi.fn(),
  mockUpdate: vi.fn(),
  mockConfirmContribution: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    contribution: { findUnique: mockFindUnique, update: mockUpdate },
  },
}));

vi.mock("@/lib/confirmContribution", () => ({
  confirmContribution: mockConfirmContribution,
}));

beforeEach(() => {
  mockFindUnique.mockReset();
  mockUpdate.mockReset();
  mockConfirmContribution.mockReset();
});

function pendingContribution(overrides: Record<string, unknown> = {}) {
  return {
    id: "contrib_1",
    providerSessionId: "cs_1",
    paymentProvider: PaymentProvider.STRIPE,
    paymentStatus: PaymentStatus.PENDING,
    amountCents: 500,
    ...overrides,
  };
}

function session(overrides: Record<string, unknown> = {}) {
  return {
    id: "cs_1",
    currency: "usd",
    amount_total: 500,
    payment_status: "paid",
    payment_intent: "pi_1",
    metadata: { contributionId: "contrib_1" },
    ...overrides,
  } as never;
}

describe("handleCheckoutSessionCompleted", () => {
  it("confirms a valid, fully-matching paid session", async () => {
    mockFindUnique.mockResolvedValue(pendingContribution());
    mockConfirmContribution.mockResolvedValue({ status: "confirmed" });
    mockUpdate.mockResolvedValue({});

    await handleCheckoutSessionCompleted(session());

    expect(mockConfirmContribution).toHaveBeenCalledWith("contrib_1", PaymentProvider.STRIPE);
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "contrib_1" },
      data: { providerPaymentId: "pi_1" },
    });
  });

  it("does not confirm when the metadata is missing a contributionId", async () => {
    await handleCheckoutSessionCompleted(session({ metadata: {} }));
    expect(mockConfirmContribution).not.toHaveBeenCalled();
  });

  it("does not confirm when the contribution cannot be found", async () => {
    mockFindUnique.mockResolvedValue(null);
    await handleCheckoutSessionCompleted(session());
    expect(mockConfirmContribution).not.toHaveBeenCalled();
  });

  it("rejects when the stored session id does not match", async () => {
    mockFindUnique.mockResolvedValue(pendingContribution({ providerSessionId: "cs_other" }));
    await handleCheckoutSessionCompleted(session());
    expect(mockConfirmContribution).not.toHaveBeenCalled();
  });

  it("rejects when the payment provider is not STRIPE", async () => {
    mockFindUnique.mockResolvedValue(pendingContribution({ paymentProvider: PaymentProvider.MOCK }));
    await handleCheckoutSessionCompleted(session());
    expect(mockConfirmContribution).not.toHaveBeenCalled();
  });

  it("skips contributions that are no longer pending", async () => {
    mockFindUnique.mockResolvedValue(pendingContribution({ paymentStatus: PaymentStatus.CONFIRMED }));
    await handleCheckoutSessionCompleted(session());
    expect(mockConfirmContribution).not.toHaveBeenCalled();
  });

  it("rejects a currency mismatch", async () => {
    mockFindUnique.mockResolvedValue(pendingContribution());
    await handleCheckoutSessionCompleted(session({ currency: "gbp" }));
    expect(mockConfirmContribution).not.toHaveBeenCalled();
  });

  it("rejects an amount mismatch", async () => {
    mockFindUnique.mockResolvedValue(pendingContribution());
    await handleCheckoutSessionCompleted(session({ amount_total: 999 }));
    expect(mockConfirmContribution).not.toHaveBeenCalled();
  });

  it("does not confirm an unpaid session", async () => {
    mockFindUnique.mockResolvedValue(pendingContribution());
    await handleCheckoutSessionCompleted(session({ payment_status: "unpaid" }));
    expect(mockConfirmContribution).not.toHaveBeenCalled();
  });
});
