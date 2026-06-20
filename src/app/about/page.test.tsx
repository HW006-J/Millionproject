import { afterEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import AboutPage from "@/app/about/page";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("AboutPage", () => {
  it("renders successfully", () => {
    expect(() => renderToStaticMarkup(AboutPage())).not.toThrow();
  });

  it("shows an explicit placeholder when contact email is not configured", () => {
    vi.stubEnv("CONTACT_EMAIL", "");
    const html = renderToStaticMarkup(AboutPage());
    expect(html).toContain("[CONTACT EMAIL]");
  });

  it("renders a configured contact email safely", () => {
    vi.stubEnv("CONTACT_EMAIL", "hello@example.test");
    const html = renderToStaticMarkup(AboutPage());
    expect(html).toContain("hello@example.test");
  });

  it("never invents an intended use of funds", () => {
    const html = renderToStaticMarkup(AboutPage());
    expect(html).toContain("[INTENDED USE OF FUNDS]");
  });

  it("includes the development-stage draft banner", () => {
    const html = renderToStaticMarkup(AboutPage());
    expect(html).toContain("Development-stage draft");
  });

  it("includes accessible navigation links to the other legal pages", () => {
    const html = renderToStaticMarkup(AboutPage());
    expect(html).toContain('href="/terms"');
    expect(html).toContain('href="/privacy"');
    expect(html).toContain('href="/refunds"');
  });
});
