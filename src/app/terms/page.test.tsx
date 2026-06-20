import { afterEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import TermsPage from "@/app/terms/page";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("TermsPage", () => {
  it("renders successfully", () => {
    expect(() => renderToStaticMarkup(TermsPage())).not.toThrow();
  });

  it("includes the development-stage draft banner", () => {
    const html = renderToStaticMarkup(TermsPage());
    expect(html).toContain("Development-stage draft");
  });

  it("includes the limitation-of-liability and jurisdiction placeholders", () => {
    const html = renderToStaticMarkup(TermsPage());
    expect(html).toContain("[LIMITATION OF LIABILITY]");
    expect(html).toContain("[OPERATING JURISDICTION]");
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

  it("shows a configured legal entity name safely", () => {
    vi.stubEnv("LEGAL_ENTITY_NAME", "Example Holdings LLC");
    const html = renderToStaticMarkup(TermsPage());
    expect(html).toContain("Example Holdings LLC");
  });

  it("includes accessible navigation links to the other legal pages", () => {
    const html = renderToStaticMarkup(TermsPage());
    expect(html).toContain('href="/about"');
    expect(html).toContain('href="/privacy"');
    expect(html).toContain('href="/refunds"');
  });
});
