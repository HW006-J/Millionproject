import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import TermsPage from "@/app/terms/page";

describe("TermsPage", () => {
  it("renders successfully", () => {
    expect(() => renderToStaticMarkup(TermsPage())).not.toThrow();
  });

  it("no longer shows the development-stage draft banner", () => {
    const html = renderToStaticMarkup(TermsPage());
    expect(html).not.toContain("Development-stage draft");
    expect(html).not.toContain("Draft");
  });

  it("no longer shows any bracketed placeholder", () => {
    const html = renderToStaticMarkup(TermsPage());
    expect(html).not.toMatch(/\[[A-Z ]+\]/);
  });

  it("never claims contributions are donations for tax purposes", () => {
    const html = renderToStaticMarkup(TermsPage());
    expect(html.toLowerCase()).not.toContain("tax-deduct");
    expect(html.toLowerCase()).not.toContain("tax deduct");
  });

  it("never claims users waive statutory rights", () => {
    const html = renderToStaticMarkup(TermsPage());
    expect(html.toLowerCase()).not.toContain("waive");
  });

  it("states John White receives and may use the funds", () => {
    const html = renderToStaticMarkup(TermsPage());
    expect(html).toContain("Contributions are received by John White.");
    expect(html).toContain("Contributions may be used by John White at his sole discretion");
  });

  it("states ONE MILLION is not a charity and contributions are not eligible for Gift Aid", () => {
    const html = renderToStaticMarkup(TermsPage());
    expect(html).toContain("ONE MILLION is not a charity, and contributions are not eligible for Gift Aid.");
  });

  it("names Stripe as the payment processor", () => {
    const html = renderToStaticMarkup(TermsPage());
    expect(html).toContain("Payments are processed by Stripe.");
  });

  it("states the governing law and jurisdiction", () => {
    const html = renderToStaticMarkup(TermsPage());
    expect(html).toContain("governed by the laws of England and Wales");
    expect(html).toContain("The courts of England and Wales will have jurisdiction");
  });

  it("does not claim the terms have received professional legal approval", () => {
    const html = renderToStaticMarkup(TermsPage());
    expect(html.toLowerCase()).not.toContain("reviewed by a lawyer");
    expect(html.toLowerCase()).not.toContain("legal advice");
    expect(html.toLowerCase()).not.toContain("legal review");
  });

  it("does not say real payments cannot yet be accepted", () => {
    const html = renderToStaticMarkup(TermsPage());
    expect(html.toLowerCase()).not.toContain("not yet configured");
    expect(html.toLowerCase()).not.toContain("not yet been reviewed");
  });

  it("shows the contact email", () => {
    const html = renderToStaticMarkup(TermsPage());
    expect(html).toContain("millionproject1m@gmail.com");
  });

  it("shows a last-updated date", () => {
    const html = renderToStaticMarkup(TermsPage());
    expect(html).toContain("Last updated: 20 June 2026");
  });

  it("includes accessible navigation links to the other legal pages", () => {
    const html = renderToStaticMarkup(TermsPage());
    expect(html).toContain('href="/about"');
    expect(html).toContain('href="/privacy"');
    expect(html).toContain('href="/refunds"');
  });
});
