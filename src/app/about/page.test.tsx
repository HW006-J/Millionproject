import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import AboutPage from "@/app/about/page";

describe("AboutPage", () => {
  it("renders successfully", () => {
    expect(() => renderToStaticMarkup(AboutPage())).not.toThrow();
  });

  it("states who receives the funds", () => {
    const html = renderToStaticMarkup(AboutPage());
    expect(html).toContain("Funds are paid to John White.");
  });

  it("states the intended use of funds has not yet been decided", () => {
    const html = renderToStaticMarkup(AboutPage());
    expect(html).toContain("The intended use of the funds has not yet been decided.");
  });

  it("shows the configured contact email", () => {
    const html = renderToStaticMarkup(AboutPage());
    expect(html).toContain("millionproject1m@gmail.com");
  });

  it("no longer shows any bracketed placeholder", () => {
    const html = renderToStaticMarkup(AboutPage());
    expect(html).not.toMatch(/\[[A-Z ]+\]/);
  });

  it("no longer shows the development-stage draft banner", () => {
    const html = renderToStaticMarkup(AboutPage());
    expect(html).not.toContain("Development-stage draft");
  });

  it("shows a last-updated date", () => {
    const html = renderToStaticMarkup(AboutPage());
    expect(html).toContain("Last updated: 20 June 2026");
  });

  it("includes accessible navigation links to the other legal pages", () => {
    const html = renderToStaticMarkup(AboutPage());
    expect(html).toContain('href="/terms"');
    expect(html).toContain('href="/privacy"');
    expect(html).toContain('href="/refunds"');
  });
});
