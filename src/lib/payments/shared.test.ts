import { beforeEach, describe, expect, it, vi } from "vitest";
import { Prisma, PaymentProvider, PaymentStatus } from "@prisma/client";
import { findOrCreatePendingContribution, resolveNonPendingRedirect } from "@/lib/payments/shared";

const { mockFindUnique, mockCreate } = vi.hoisted(() => ({
  mockFindUnique: vi.fn(),
  mockCreate: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    contribution: {
      findUnique: mockFindUnique,
      create: mockCreate,
    },
  },
}));

beforeEach(() => {
  mockFindUnique.mockReset();
  mockCreate.mockReset();
});

const baseInput = {
  campaignId: "camp_1",
  amountCents: 500,
  isAnonymous: true,
  publicName: null,
  hideAmountPublicly: false,
  paymentProvider: PaymentProvider.MOCK,
};

function uniqueConstraintError(target: string) {
  return new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
    code: "P2002",
    clientVersion: "test",
    meta: { target: [target] },
  });
}

describe("findOrCreatePendingContribution", () => {
  it("creates a new contribution when no submissionToken is given", async () => {
    mockCreate.mockResolvedValue({ id: "contrib_1" });

    const result = await findOrCreatePendingContribution({ ...baseInput, submissionToken: null });

    expect(mockFindUnique).not.toHaveBeenCalled();
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
        submissionToken: null,
      },
    });
    expect(result).toEqual({ id: "contrib_1" });
  });

  it("creates a new contribution with the submissionToken when no existing row matches", async () => {
    mockFindUnique.mockResolvedValue(null);
    mockCreate.mockResolvedValue({ id: "contrib_2" });

    const result = await findOrCreatePendingContribution({
      ...baseInput,
      submissionToken: "token-abc",
    });

    expect(mockFindUnique).toHaveBeenCalledWith({ where: { submissionToken: "token-abc" } });
    expect(mockCreate).toHaveBeenCalled();
    expect(result).toEqual({ id: "contrib_2" });
  });

  it("reuses an existing contribution for the same submissionToken without creating a new one", async () => {
    mockFindUnique.mockResolvedValue({ id: "contrib_existing", paymentStatus: PaymentStatus.PENDING });

    const result = await findOrCreatePendingContribution({
      ...baseInput,
      submissionToken: "token-abc",
    });

    expect(mockCreate).not.toHaveBeenCalled();
    expect(result).toEqual({ id: "contrib_existing", paymentStatus: PaymentStatus.PENDING });
  });

  it("falls back to the existing row when it loses a race on the unique constraint", async () => {
    mockFindUnique
      .mockResolvedValueOnce(null) // initial check: nothing yet
      .mockResolvedValueOnce({ id: "contrib_winner" }); // re-check after losing the race
    mockCreate.mockRejectedValue(uniqueConstraintError("submissionToken"));

    const result = await findOrCreatePendingContribution({
      ...baseInput,
      submissionToken: "token-race",
    });

    expect(result).toEqual({ id: "contrib_winner" });
  });

  it("rethrows unrelated database errors", async () => {
    mockFindUnique.mockResolvedValue(null);
    mockCreate.mockRejectedValue(new Error("connection lost"));

    await expect(
      findOrCreatePendingContribution({ ...baseInput, submissionToken: "token-x" }),
    ).rejects.toThrow("connection lost");
  });
});

describe("resolveNonPendingRedirect", () => {
  it("sends confirmed contributions to the success page", () => {
    expect(
      resolveNonPendingRedirect({ id: "c1", paymentStatus: PaymentStatus.CONFIRMED }),
    ).toBe("/success/c1");
  });

  it("sends refunded contributions to the success page", () => {
    expect(
      resolveNonPendingRedirect({ id: "c1", paymentStatus: PaymentStatus.REFUNDED }),
    ).toBe("/success/c1");
  });

  it("sends anything else home", () => {
    expect(resolveNonPendingRedirect({ id: "c1", paymentStatus: PaymentStatus.FAILED })).toBe("/");
  });
});
