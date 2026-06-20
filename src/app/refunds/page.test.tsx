import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import RefundsPage from "@/app/refunds/page";

describe("RefundsPage", () => {
  it("renders successfully", () => {
    expect(() => renderToStaticMarkup(RefundsPage())).not.toThrow();
  });

  it("no longer shows the development-stage draft banner", () => {
    const html = renderToStaticMarkup(RefundsPage());
    expect(html).not.toContain("Development-stage draft");
    expect(html).not.toContain("Draft");
  });

  it("no longer shows any bracketed placeholder", () => {
    const html = renderToStaticMarkup(RefundsPage());
    expect(html).not.toMatch(/\[[A-Z ]+\]/);
  });

  it("states contributions are normally final and non-refundable", () => {
    const html = renderToStaticMarkup(RefundsPage());
    expect(html).toContain("Contributions to ONE MILLION are voluntary and are normally final and non-refundable.");
  });

  it("never promises a fixed refund deadline", () => {
    const html = renderToStaticMarkup(RefundsPage());
    expect(html.toLowerCase()).not.toMatch(/within \d+ (day|business day)/);
  });

  it("does not guarantee refund approval", () => {
    const html = renderToStaticMarkup(RefundsPage());
    expect(html).toContain("Submitting a request does not guarantee that a refund will be approved.");
  });

  it("does not override statutory rights", () => {
    const html = renderToStaticMarkup(RefundsPage());
    expect(html).toContain("Nothing in this policy removes any statutory right to a refund that cannot legally be excluded.");
  });

  it("explains the effect on the public total", () => {
    const html = renderToStaticMarkup(RefundsPage());
    expect(html).toContain("A full refund will remove the refunded contribution from the publicly displayed total");
    expect(html).toContain("A partial refund will reduce the contribution and public total by the amount refunded.");
  });

  it("warns against sending full card details by email", () => {
    const html = renderToStaticMarkup(RefundsPage());
    expect(html).toContain("Do not send a full card number or card security code by email.");
  });

  it("shows the contact email", () => {
    const html = renderToStaticMarkup(RefundsPage());
    expect(html).toContain("millionproject1m@gmail.com");
  });

  it("shows a last-updated date", () => {
    const html = renderToStaticMarkup(RefundsPage());
    expect(html).toContain("Last updated: 20 June 2026");
  });

  it("includes accessible navigation links to the other legal pages", () => {
    const html = renderToStaticMarkup(RefundsPage());
    expect(html).toContain('href="/about"');
    expect(html).toContain('href="/terms"');
    expect(html).toContain('href="/privacy"');
  });
});
