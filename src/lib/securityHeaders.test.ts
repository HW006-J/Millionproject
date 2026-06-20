import { afterEach, describe, expect, it, vi } from "vitest";
import { buildContentSecurityPolicy, buildSecurityHeaders } from "@/lib/securityHeaders";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("buildContentSecurityPolicy", () => {
  it("starts from default-src 'self'", () => {
    expect(buildContentSecurityPolicy()).toContain("default-src 'self'");
  });

  it("always includes object-src 'none'", () => {
    expect(buildContentSecurityPolicy()).toContain("object-src 'none'");
  });

  it("always includes base-uri 'self'", () => {
    expect(buildContentSecurityPolicy()).toContain("base-uri 'self'");
  });

  it("blocks framing via frame-ancestors 'none'", () => {
    expect(buildContentSecurityPolicy()).toContain("frame-ancestors 'none'");
  });

  it("restricts form-action to 'self'", () => {
    expect(buildContentSecurityPolicy()).toContain("form-action 'self'");
  });

  it("includes the required baseline directives", () => {
    const csp = buildContentSecurityPolicy();
    for (const directive of [
      "default-src",
      "base-uri",
      "object-src",
      "frame-ancestors",
      "form-action",
      "img-src",
      "font-src",
      "style-src",
      "script-src",
      "connect-src",
    ]) {
      expect(csp).toContain(directive);
    }
  });

  it("never adds any Stripe domain — the browser never loads anything from Stripe directly", () => {
    expect(buildContentSecurityPolicy().toLowerCase()).not.toContain("stripe");
  });

  it("excludes 'unsafe-eval' in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(buildContentSecurityPolicy()).not.toContain("unsafe-eval");
  });

  it("includes 'unsafe-eval' in development only (React's documented dev-mode requirement)", () => {
    vi.stubEnv("NODE_ENV", "development");
    expect(buildContentSecurityPolicy()).toContain("unsafe-eval");
  });

  it("adds upgrade-insecure-requests only in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(buildContentSecurityPolicy()).toContain("upgrade-insecure-requests");
    vi.stubEnv("NODE_ENV", "development");
    expect(buildContentSecurityPolicy()).not.toContain("upgrade-insecure-requests");
  });
});

describe("buildSecurityHeaders", () => {
  it("includes X-Content-Type-Options: nosniff", () => {
    const headers = buildSecurityHeaders();
    expect(headers).toContainEqual({ key: "X-Content-Type-Options", value: "nosniff" });
  });

  it("includes a Referrer-Policy", () => {
    const headers = buildSecurityHeaders();
    expect(headers.find((h) => h.key === "Referrer-Policy")?.value).toBe(
      "strict-origin-when-cross-origin",
    );
  });

  it("includes a Permissions-Policy", () => {
    const headers = buildSecurityHeaders();
    expect(headers.some((h) => h.key === "Permissions-Policy")).toBe(true);
  });

  it("includes X-Frame-Options: DENY", () => {
    const headers = buildSecurityHeaders();
    expect(headers).toContainEqual({ key: "X-Frame-Options", value: "DENY" });
  });

  it("includes a Content-Security-Policy header", () => {
    const headers = buildSecurityHeaders();
    expect(headers.some((h) => h.key === "Content-Security-Policy")).toBe(true);
  });

  it("never includes Access-Control-Allow-Origin (no wildcard CORS)", () => {
    const headers = buildSecurityHeaders();
    expect(headers.some((h) => h.key.toLowerCase() === "access-control-allow-origin")).toBe(
      false,
    );
  });

  it("includes Strict-Transport-Security in production with exactly a 1-year max-age and nothing else", () => {
    vi.stubEnv("NODE_ENV", "production");
    const headers = buildSecurityHeaders();
    expect(headers.find((h) => h.key === "Strict-Transport-Security")?.value).toBe(
      "max-age=31536000",
    );
  });

  it("never enables includeSubDomains or preload by default", () => {
    vi.stubEnv("NODE_ENV", "production");
    const headers = buildSecurityHeaders();
    const hsts = headers.find((h) => h.key === "Strict-Transport-Security")?.value;
    expect(hsts).not.toContain("includeSubDomains");
    expect(hsts).not.toContain("preload");
  });

  it("excludes Strict-Transport-Security in development (plain HTTP locally)", () => {
    vi.stubEnv("NODE_ENV", "development");
    const headers = buildSecurityHeaders();
    expect(headers.some((h) => h.key === "Strict-Transport-Security")).toBe(false);
  });
});
