import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockGetCheckoutProvider, mockFindUnique, mockCreateCheckout } = vi.hoisted(() => ({
  mockGetCheckoutProvider: vi.fn(),
  mockFindUnique: vi.fn(),
  mockCreateCheckout: vi.fn(),
}));

vi.mock("@/lib/payments", () => ({
  getCheckoutProvider: mockGetCheckoutProvider,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: { campaign: { findUnique: mockFindUnique } },
}));

const { POST } = await import("@/app/api/checkout/route");

beforeEach(() => {
  mockGetCheckoutProvider.mockReset();
  mockFindUnique.mockReset();
  mockCreateCheckout.mockReset();
  mockGetCheckoutProvider.mockReturnValue({ createCheckout: mockCreateCheckout });
});

function postRequest(body: unknown) {
  return new Request("http://localhost:3000/api/checkout", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

describe("POST /api/checkout", () => {
  it("returns 503 without touching the database when no provider is available", async () => {
    mockGetCheckoutProvider.mockReturnValue(null);

    const response = await POST(postRequest({ amountCents: 500, isAnonymous: true }));

    expect(response.status).toBe(503);
    expect(mockFindUnique).not.toHaveBeenCalled();
  });

  it("rejects an invalid amount before checking the campaign", async () => {
    const response = await POST(postRequest({ amountCents: 1.5, isAnonymous: true }));

    expect(response.status).toBe(400);
    expect(mockFindUnique).not.toHaveBeenCalled();
  });

  it("blocks new checkout creation while the campaign is paused", async () => {
    mockFindUnique.mockResolvedValue({ id: "camp_1", isActive: false });

    const response = await POST(postRequest({ amountCents: 500, isAnonymous: true }));
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.error).toBeTruthy();
    expect(mockCreateCheckout).not.toHaveBeenCalled();
  });

  it("returns 503 when the campaign does not exist", async () => {
    mockFindUnique.mockResolvedValue(null);

    const response = await POST(postRequest({ amountCents: 500, isAnonymous: true }));

    expect(response.status).toBe(503);
    expect(mockCreateCheckout).not.toHaveBeenCalled();
  });

  it("creates a checkout when the campaign is active and the input is valid", async () => {
    mockFindUnique.mockResolvedValue({ id: "camp_1", isActive: true });
    mockCreateCheckout.mockResolvedValue({
      contributionId: "contrib_1",
      redirectUrl: "/mock-checkout/contrib_1",
    });

    const response = await POST(
      postRequest({ amountCents: 500, isAnonymous: true, submissionToken: "tok_1" }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mockCreateCheckout).toHaveBeenCalledWith({
      campaignId: "camp_1",
      amountCents: 500,
      isAnonymous: true,
      publicName: null,
      hideAmountPublicly: false,
      submissionToken: "tok_1",
    });
    expect(body).toEqual({ contributionId: "contrib_1", redirectUrl: "/mock-checkout/contrib_1" });
  });
});
