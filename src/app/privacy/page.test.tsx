import { afterEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import PrivacyPage from "@/app/privacy/page";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("PrivacyPage", () => {
  it("renders successfully", () => {
    expect(() => renderToStaticMarkup(PrivacyPage())).not.toThrow();
  });

  it("truthfully states there is no analytics/advertising tracking", () => {
    const html = renderToStaticMarkup(PrivacyPage());
    expect(html).toContain("does not currently use advertising or analytics");
  });

  it("explicitly disclaims absolute security or guaranteed deletion, rather than promising them", () => {
    const html = renderToStaticMarkup(PrivacyPage());
    const lower = html.toLowerCase();
    expect(lower).toContain("do not claim absolute security");
    expect(lower).toContain("guaranteed deletion");
    // Never asserts security/deletion as an unqualified promise.
    expect(lower).not.toMatch(/we guarantee/);
  });

  it("shows explicit placeholders for retention and data-rights process", () => {
    const html = renderToStaticMarkup(PrivacyPage());
    expect(html).toContain("[DATA RETENTION POLICY]");
    expect(html).toContain("[DATA RIGHTS PROCESS]");
  });

  it("escapes a script-like CONTACT_EMAIL value rather than rendering it as markup", () => {
    vi.stubEnv("CONTACT_EMAIL", "<script>alert(1)</script>@example.test");
    const html = renderToStaticMarkup(PrivacyPage());
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("escapes a script-like LEGAL_ENTITY_NAME value rather than rendering it as markup", () => {
    vi.stubEnv("LEGAL_ENTITY_NAME", '<img src=x onerror="alert(1)">');
    const html = renderToStaticMarkup(PrivacyPage());
    expect(html).not.toContain('<img src=x onerror="alert(1)">');
    expect(html).toContain("&lt;img");
  });

  it("includes accessible navigation links to the other legal pages", () => {
    const html = renderToStaticMarkup(PrivacyPage());
    expect(html).toContain('href="/about"');
    expect(html).toContain('href="/terms"');
    expect(html).toContain('href="/refunds"');
  });
});
