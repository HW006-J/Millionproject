import { beforeEach, describe, expect, it, vi } from "vitest";
import { PaymentStatus } from "@prisma/client";
import { GET } from "@/app/api/contributions/[contributionId]/status/route";

const { mockFindUnique } = vi.hoisted(() => ({ mockFindUnique: vi.fn() }));

vi.mock("@/lib/prisma", () => ({
  prisma: { contribution: { findUnique: mockFindUnique } },
}));

beforeEach(() => {
  mockFindUnique.mockReset();
});

function params(contributionId: string) {
  return { params: Promise.resolve({ contributionId }) };
}

describe("GET /api/contributions/[contributionId]/status", () => {
  it("returns only the payment status, with a select that excludes everything else", async () => {
    mockFindUnique.mockResolvedValue({ paymentStatus: PaymentStatus.CONFIRMED });

    const response = await GET(new Request("http://localhost/x"), params("contrib_1"));
    const body = await response.json();

    expect(mockFindUnique).toHaveBeenCalledWith({
      where: { id: "contrib_1" },
      select: { paymentStatus: true },
    });
    expect(body).toEqual({ status: "CONFIRMED" });
    expect(Object.keys(body)).toEqual(["status"]);
  });

  it("returns 404 without leaking anything for a missing contribution", async () => {
    mockFindUnique.mockResolvedValue(null);

    const response = await GET(new Request("http://localhost/x"), params("missing"));

    expect(response.status).toBe(404);
  });
});
