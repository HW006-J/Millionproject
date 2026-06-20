import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import OfflinePage from "@/app/offline/page";

describe("OfflinePage", () => {
  it("renders successfully", () => {
    expect(() => renderToStaticMarkup(OfflinePage())).not.toThrow();
  });

  it("explicitly states a connection is required for totals, contributing, and admin", () => {
    const html = renderToStaticMarkup(OfflinePage());
    expect(html).toContain("internet connection is required");
    expect(html.toLowerCase()).toContain("current total");
    expect(html.toLowerCase()).toContain("contribute");
    expect(html.toLowerCase()).toContain("admin");
  });

  it("never shows a campaign total or any dollar figure", () => {
    const html = renderToStaticMarkup(OfflinePage());
    expect(html).not.toMatch(/\$[\d,]/);
  });

  it("never includes a payment control", () => {
    const html = renderToStaticMarkup(OfflinePage());
    expect(html.toLowerCase()).not.toContain("checkout");
    expect(html.toLowerCase()).not.toContain("contribute now");
    expect(html).not.toContain("<form");
  });

  it("offers a way back to the homepage", () => {
    const html = renderToStaticMarkup(OfflinePage());
    expect(html).toContain('href="/"');
  });
});
