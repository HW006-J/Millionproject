import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import PrivacyPage from "@/app/privacy/page";

describe("PrivacyPage", () => {
  it("renders successfully", () => {
    expect(() => renderToStaticMarkup(PrivacyPage())).not.toThrow();
  });

  it("no longer shows the development-stage draft banner", () => {
    const html = renderToStaticMarkup(PrivacyPage());
    expect(html).not.toContain("Development-stage draft");
    expect(html).not.toContain("Draft");
  });

  it("no longer shows any bracketed placeholder", () => {
    const html = renderToStaticMarkup(PrivacyPage());
    expect(html).not.toMatch(/\[[A-Z ]+\]/);
  });

  it("names John White as responsible for personal information", () => {
    const html = renderToStaticMarkup(PrivacyPage());
    expect(html).toContain("The person responsible for the handling of personal information for this project is John White.");
  });

  it("never claims ONE MILLION stores complete card information", () => {
    const html = renderToStaticMarkup(PrivacyPage());
    const lower = html.toLowerCase();
    expect(lower).not.toContain("we store your card");
    expect(html).toContain("are not received or stored by ONE MILLION");
  });

  it("accurately describes cookies/technical storage based on the real implementation", () => {
    const html = renderToStaticMarkup(PrivacyPage());
    expect(html).toContain(
      "ONE MILLION uses only technical storage that is reasonably necessary to operate and secure the website.",
    );
    expect(html).not.toContain("does not use any cookies");
  });

  it("disclaims, rather than promises, complete security", () => {
    const html = renderToStaticMarkup(PrivacyPage());
    expect(html).toContain("no internet service or storage system can guarantee complete security");
  });

  it("does not claim the policy has received professional legal approval", () => {
    const html = renderToStaticMarkup(PrivacyPage());
    expect(html.toLowerCase()).not.toContain("reviewed by a lawyer");
    expect(html.toLowerCase()).not.toContain("legal advice");
  });

  it("mentions the named service providers", () => {
    const html = renderToStaticMarkup(PrivacyPage());
    expect(html).toContain("Stripe for payment processing");
    expect(html).toContain("Vercel for website hosting and delivery");
    expect(html).toContain("Neon for database hosting");
  });

  it("mentions the UK Information Commissioner's Office for data-rights escalation", () => {
    const html = renderToStaticMarkup(PrivacyPage());
    expect(html).toContain("UK Information Commissioner");
  });

  it("shows the contact email", () => {
    const html = renderToStaticMarkup(PrivacyPage());
    expect(html).toContain("millionproject1m@gmail.com");
  });

  it("shows a last-updated date", () => {
    const html = renderToStaticMarkup(PrivacyPage());
    expect(html).toContain("Last updated: 20 June 2026");
  });

  it("includes accessible navigation links to the other legal pages", () => {
    const html = renderToStaticMarkup(PrivacyPage());
    expect(html).toContain('href="/about"');
    expect(html).toContain('href="/terms"');
    expect(html).toContain('href="/refunds"');
  });
});
