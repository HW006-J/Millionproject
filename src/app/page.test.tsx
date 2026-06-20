import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

const { mockGetCampaignStats } = vi.hoisted(() => ({ mockGetCampaignStats: vi.fn() }));

vi.mock("@/lib/campaign", () => ({
  getCampaignStats: mockGetCampaignStats,
}));

// ContributionSelector needs the real Next.js App Router context (useRouter),
// which renderToStaticMarkup doesn't provide. It has its own dedicated tests
// elsewhere — here we only need a stub so this test can focus on the footer.
vi.mock("@/components/ContributionSelector", () => ({
  ContributionSelector: () => "ADD TO THE MILLION",
}));

const { default: Home } = await import("@/app/page");

beforeEach(() => {
  mockGetCampaignStats.mockReset();
});

describe("Home (landing page)", () => {
  it("includes accessible footer links to all four legal pages without disturbing the CTA", async () => {
    mockGetCampaignStats.mockResolvedValue({
      name: "ONE MILLION",
      targetAmountCents: 100_000_000,
      confirmedAmountCents: 100,
      confirmedContributionCount: 1,
      raisedTodayCents: 100,
      raisedLastHourCents: 0,
      averageContributionCents: 100,
    });

    const html = renderToStaticMarkup(await Home());

    expect(html).toContain('href="/about"');
    expect(html).toContain('href="/terms"');
    expect(html).toContain('href="/privacy"');
    expect(html).toContain('href="/refunds"');
    expect(html).toContain("ADD TO THE MILLION");
  });

  it("still renders the footer links even when campaign stats are unavailable", async () => {
    mockGetCampaignStats.mockResolvedValue(null);

    const html = renderToStaticMarkup(await Home());

    expect(html).toContain('href="/about"');
    expect(html).toContain("ADD TO THE MILLION");
  });
});
