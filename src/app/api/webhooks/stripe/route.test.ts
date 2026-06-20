import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/webhooks/stripe/route";

const { mockGetStripeConfig, mockGetStripeClient, mockConstructEvent, mockProcessStripeEvent } =
  vi.hoisted(() => ({
    mockGetStripeConfig: vi.fn(),
    mockGetStripeClient: vi.fn(),
    mockConstructEvent: vi.fn(),
    mockProcessStripeEvent: vi.fn(),
  }));

vi.mock("@/lib/stripe", () => ({
  getStripeConfig: mockGetStripeConfig,
  getStripeClient: mockGetStripeClient,
}));

vi.mock("@/lib/webhooks/processStripeEvent", () => ({
  processStripeEvent: mockProcessStripeEvent,
}));

const validConfig = { secretKey: "sk_test", webhookSecret: "whsec_test", currency: "usd" };

function makeRequest(body: string, headers: Record<string, string> = {}) {
  return new Request("http://localhost:3000/api/webhooks/stripe", {
    method: "POST",
    body,
    headers,
  });
}

beforeEach(() => {
  mockGetStripeConfig.mockReset();
  mockGetStripeClient.mockReset();
  mockConstructEvent.mockReset();
  mockProcessStripeEvent.mockReset();
  mockGetStripeClient.mockReturnValue({ webhooks: { constructEvent: mockConstructEvent } });
});

describe("POST /api/webhooks/stripe", () => {
  it("fails closed with 500 when Stripe is not configured", async () => {
    mockGetStripeConfig.mockReturnValue(null);

    const response = await POST(makeRequest("{}", { "stripe-signature": "sig" }));

    expect(response.status).toBe(500);
    expect(mockConstructEvent).not.toHaveBeenCalled();
  });

  it("rejects a request with no signature header", async () => {
    mockGetStripeConfig.mockReturnValue(validConfig);

    const response = await POST(makeRequest("{}"));

    expect(response.status).toBe(400);
    expect(mockConstructEvent).not.toHaveBeenCalled();
  });

  it("rejects a request with an invalid signature", async () => {
    mockGetStripeConfig.mockReturnValue(validConfig);
    mockConstructEvent.mockImplementation(() => {
      throw new Error("signature mismatch");
    });

    const response = await POST(makeRequest("{}", { "stripe-signature": "bad-sig" }));

    expect(response.status).toBe(400);
    expect(mockProcessStripeEvent).not.toHaveBeenCalled();
  });

  it("processes a verified event and acknowledges it", async () => {
    mockGetStripeConfig.mockReturnValue(validConfig);
    const event = { id: "evt_1", type: "checkout.session.completed" };
    mockConstructEvent.mockReturnValue(event);
    mockProcessStripeEvent.mockResolvedValue(undefined);

    const response = await POST(makeRequest("{}", { "stripe-signature": "good-sig" }));

    expect(mockProcessStripeEvent).toHaveBeenCalledWith(event);
    expect(response.status).toBe(200);
  });

  it("returns 500 when processing fails after a valid signature", async () => {
    mockGetStripeConfig.mockReturnValue(validConfig);
    mockConstructEvent.mockReturnValue({ id: "evt_1", type: "checkout.session.completed" });
    mockProcessStripeEvent.mockRejectedValue(new Error("db exploded"));

    const response = await POST(makeRequest("{}", { "stripe-signature": "good-sig" }));

    expect(response.status).toBe(500);
  });
});
