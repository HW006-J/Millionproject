import { beforeEach, describe, expect, it, vi } from "vitest";
import { PaymentStatus } from "@prisma/client";

const { mockRequireAdmin, mockCampaignFindUnique, mockContributionFindMany } = vi.hoisted(() => ({
  mockRequireAdmin: vi.fn(),
  mockCampaignFindUnique: vi.fn(),
  mockContributionFindMany: vi.fn(),
}));

vi.mock("@/lib/admin/auth", () => ({
  requireAdmin: mockRequireAdmin,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    campaign: { findUnique: mockCampaignFindUnique },
    contribution: { findMany: mockContributionFindMany },
  },
}));

const { GET } = await import("@/app/admin/export/route");

beforeEach(() => {
  mockRequireAdmin.mockReset();
  mockCampaignFindUnique.mockReset();
  mockContributionFindMany.mockReset();
  mockRequireAdmin.mockResolvedValue({ id: "admin_1", email: "admin@example.com" });
});

describe("GET /admin/export", () => {
  it("requires server-side authorization before reading any data", async () => {
    mockRequireAdmin.mockRejectedValue(new Error("REDIRECT:/admin/login"));

    await expect(GET()).rejects.toThrow("REDIRECT:/admin/login");

    expect(mockCampaignFindUnique).not.toHaveBeenCalled();
  });

  it("sets non-cacheable, UTF-8 CSV headers with a safe filename", async () => {
    mockCampaignFindUnique.mockResolvedValue({ id: "camp_1" });
    mockContributionFindMany.mockResolvedValue([]);

    const response = await GET();

    expect(response.headers.get("Content-Type")).toBe("text/csv; charset=utf-8");
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(response.headers.get("Content-Disposition")).toBe(
      'attachment; filename="one-million-contributions.csv"',
    );
  });

  it("includes a header row and the minimum necessary columns, with no provider IDs or secrets", async () => {
    mockCampaignFindUnique.mockResolvedValue({ id: "camp_1" });
    mockContributionFindMany.mockResolvedValue([
      {
        id: "contrib_1",
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        confirmedAt: new Date("2026-01-01T00:05:00.000Z"),
        paymentStatus: PaymentStatus.CONFIRMED,
        amountCents: 500,
        refundedAmountCents: 0,
        publicName: "Henry",
        isAnonymous: false,
        publicNameHidden: false,
        contributorNumber: 1,
      },
    ]);

    const response = await GET();
    const body = await response.text();

    expect(body).toContain("Contribution ID,Created At (UTC),Confirmed At (UTC)");
    expect(body).toContain("contrib_1");
    expect(body).toContain("Henry");
    expect(body).not.toMatch(/cs_test|pi_test|sk_test|whsec_|providerSessionId|providerPaymentId/i);
  });

  it("shows the real submitted name for admin audit even when hidden from the public, alongside the hidden flag", async () => {
    // CSV export is admin-only (gated by requireAdmin()) — the public-name
    // suppression rule applies to public-facing surfaces (getShareData),
    // not to this audit export, which explicitly needs both the real name
    // and a separate public-name-hidden column per spec.
    mockCampaignFindUnique.mockResolvedValue({ id: "camp_1" });
    mockContributionFindMany.mockResolvedValue([
      {
        id: "contrib_1",
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        confirmedAt: new Date("2026-01-01T00:05:00.000Z"),
        paymentStatus: PaymentStatus.CONFIRMED,
        amountCents: 500,
        refundedAmountCents: 0,
        publicName: "Henry",
        isAnonymous: false,
        publicNameHidden: true,
        contributorNumber: 1,
      },
    ]);

    const response = await GET();
    const body = await response.text();

    expect(body).toContain("Henry");
    const dataRow = body.split("\r\n")[1];
    expect(dataRow).toMatch(/,true,1$/); // Public Name Hidden=true, Contributor Number=1
  });

  it("protects against spreadsheet-formula injection in the display name", async () => {
    mockCampaignFindUnique.mockResolvedValue({ id: "camp_1" });
    mockContributionFindMany.mockResolvedValue([
      {
        id: "contrib_1",
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        confirmedAt: null,
        paymentStatus: PaymentStatus.PENDING,
        amountCents: 500,
        refundedAmountCents: 0,
        publicName: "=cmd|'/bin/sh -c calc'!A1",
        isAnonymous: false,
        publicNameHidden: false,
        contributorNumber: null,
      },
    ]);

    const response = await GET();
    const body = await response.text();

    expect(body).not.toMatch(/(?<![,"]')=cmd/);
    expect(body).toContain("'=cmd");
  });

  it("preserves integer-cent accuracy when formatting amounts", async () => {
    mockCampaignFindUnique.mockResolvedValue({ id: "camp_1" });
    mockContributionFindMany.mockResolvedValue([
      {
        id: "contrib_1",
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        confirmedAt: new Date("2026-01-01T00:00:00.000Z"),
        paymentStatus: PaymentStatus.CONFIRMED,
        amountCents: 100_000_099,
        refundedAmountCents: 1,
        publicName: null,
        isAnonymous: true,
        publicNameHidden: false,
        contributorNumber: 1,
      },
    ]);

    const response = await GET();
    const body = await response.text();

    expect(body).toContain("$1,000,000.99");
    expect(body).toContain("$0.01");
  });
});
