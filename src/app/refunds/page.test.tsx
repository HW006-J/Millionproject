import { afterEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import RefundsPage from "@/app/refunds/page";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("RefundsPage", () => {
  it("renders successfully", () => {
    expect(() => renderToStaticMarkup(RefundsPage())).not.toThrow();
  });

  it("states refunds are not automatic", () => {
    const html = renderToStaticMarkup(RefundsPage());
    expect(html).toContain("not automatically entitle you to a refund");
  });

  it("shows the refund-policy placeholder rather than a fixed promised policy", () => {
    const html = renderToStaticMarkup(RefundsPage());
    expect(html).toContain("[REFUND POLICY]");
  });

  it("never promises a fixed refund deadline", () => {
    const html = renderToStaticMarkup(RefundsPage());
    expect(html.toLowerCase()).not.toMatch(/within \d+ (day|business day)/);
  });

  it("does not override statutory consumer rights", () => {
    const html = renderToStaticMarkup(RefundsPage());
    expect(html).toContain("Nothing on this page overrides any statutory consumer rights");
  });

  it("includes accessible navigation links to the other legal pages", () => {
    const html = renderToStaticMarkup(RefundsPage());
    expect(html).toContain('href="/about"');
    expect(html).toContain('href="/terms"');
    expect(html).toContain('href="/privacy"');
  });
});
