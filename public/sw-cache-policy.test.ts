import { describe, expect, it } from "vitest";
import {
  CACHE_PREFIX,
  CACHE_VERSION,
  PRECACHE_NAME,
  PRECACHE_URLS,
  RUNTIME_CACHE_NAME,
  isImmutableStaticAsset,
  isNavigationRequest,
  isNeverCachePath,
  isObsoleteOwnedCache,
  isOwnedCacheName,
  isPrecacheUrl,
  isRuntimeCacheable,
  isSameOrigin,
} from "./sw-cache-policy.js";

const ORIGIN = "https://example.test";

function makeRequest(url: string, init?: RequestInit): Request {
  return new Request(url, init);
}

function makeResponse(init?: ResponseInit & { redirected?: boolean; type?: ResponseType }): Response {
  const response = new Response("ok", init);
  if (init?.redirected) {
    Object.defineProperty(response, "redirected", { value: true });
  }
  if (init?.type) {
    Object.defineProperty(response, "type", { value: init.type });
  }
  return response;
}

describe("sw-cache-policy: precache list", () => {
  it("only lists explicitly known-safe static resources", () => {
    expect(PRECACHE_URLS).toEqual(["/offline", "/manifest.webmanifest", "/icons/icon-192.png", "/icons/icon-512.png"]);
  });

  it("never includes a /_next/static/ URL (those are unknown at install time)", () => {
    expect(PRECACHE_URLS.some((url) => url.startsWith("/_next/static/"))).toBe(false);
  });

  it("never includes any admin, api, mock-checkout, or success path", () => {
    for (const url of PRECACHE_URLS) {
      expect(isNeverCachePath(url)).toBe(false);
    }
  });

  it("isPrecacheUrl matches only the listed URLs", () => {
    expect(isPrecacheUrl("/offline")).toBe(true);
    expect(isPrecacheUrl("/admin")).toBe(false);
  });

  it("cache names are versioned", () => {
    expect(PRECACHE_NAME).toContain(CACHE_VERSION);
    expect(RUNTIME_CACHE_NAME).toContain(CACHE_VERSION);
    expect(PRECACHE_NAME).not.toBe(RUNTIME_CACHE_NAME);
  });

  it("cache names are application-prefixed and clearly separated (shell vs. static assets)", () => {
    expect(PRECACHE_NAME.startsWith(CACHE_PREFIX)).toBe(true);
    expect(RUNTIME_CACHE_NAME.startsWith(CACHE_PREFIX)).toBe(true);
    expect(PRECACHE_NAME).toContain("precache");
    expect(RUNTIME_CACHE_NAME).toContain("runtime");
  });
});

describe("sw-cache-policy: isOwnedCacheName / isObsoleteOwnedCache", () => {
  it("recognizes this app's own cache names", () => {
    expect(isOwnedCacheName(PRECACHE_NAME)).toBe(true);
    expect(isOwnedCacheName(RUNTIME_CACHE_NAME)).toBe(true);
    expect(isOwnedCacheName(`${CACHE_PREFIX}precache-v0`)).toBe(true);
  });

  it("never treats an unrelated cache name as owned", () => {
    expect(isOwnedCacheName("workbox-precache-v2")).toBe(false);
    expect(isOwnedCacheName("some-other-app-cache")).toBe(false);
    expect(isOwnedCacheName("")).toBe(false);
  });

  it("flags an obsolete (old-version) owned cache for deletion", () => {
    expect(isObsoleteOwnedCache(`${CACHE_PREFIX}precache-v0`)).toBe(true);
    expect(isObsoleteOwnedCache(`${CACHE_PREFIX}runtime-v0`)).toBe(true);
  });

  it("never flags the current owned caches for deletion", () => {
    expect(isObsoleteOwnedCache(PRECACHE_NAME)).toBe(false);
    expect(isObsoleteOwnedCache(RUNTIME_CACHE_NAME)).toBe(false);
  });

  it("never flags an unrelated cache name for deletion, even though it isn't current", () => {
    expect(isObsoleteOwnedCache("workbox-precache-v2")).toBe(false);
    expect(isObsoleteOwnedCache("some-other-app-cache")).toBe(false);
  });

  it("never flags an empty or unexpected name for deletion merely because it isn't current", () => {
    expect(isObsoleteOwnedCache("")).toBe(false);
    expect(isObsoleteOwnedCache("totally-unexpected-name")).toBe(false);
  });
});

describe("sw-cache-policy: isNeverCachePath", () => {
  it.each(["/admin", "/admin/contributions", "/api", "/api/checkout", "/mock-checkout", "/mock-checkout/abc", "/success", "/success/abc"])(
    "rejects %s",
    (pathname) => {
      expect(isNeverCachePath(pathname)).toBe(true);
    },
  );

  it("does not flag unrelated paths", () => {
    expect(isNeverCachePath("/offline")).toBe(false);
    expect(isNeverCachePath("/_next/static/chunk.js")).toBe(false);
    expect(isNeverCachePath("/")).toBe(false);
  });

  it("does not false-positive on a path that merely starts with the same letters", () => {
    expect(isNeverCachePath("/administration")).toBe(false);
    expect(isNeverCachePath("/apiary")).toBe(false);
  });
});

describe("sw-cache-policy: isImmutableStaticAsset (the allowlist)", () => {
  it("accepts hashed Next.js static assets", () => {
    expect(isImmutableStaticAsset("/_next/static/chunks/main.js")).toBe(true);
  });

  it("rejects everything else", () => {
    for (const pathname of ["/", "/admin", "/api/campaign", "/success/abc", "/offline", "/mock-checkout/abc"]) {
      expect(isImmutableStaticAsset(pathname)).toBe(false);
    }
  });
});

describe("sw-cache-policy: isSameOrigin", () => {
  it("matches identical origins", () => {
    expect(isSameOrigin(`${ORIGIN}/foo`, ORIGIN)).toBe(true);
  });

  it("rejects a different origin", () => {
    expect(isSameOrigin("https://stripe.com/checkout", ORIGIN)).toBe(false);
  });

  it("never throws on a malformed URL", () => {
    expect(isSameOrigin("not a url", ORIGIN)).toBe(false);
  });
});

describe("sw-cache-policy: isNavigationRequest", () => {
  it("recognizes navigation mode", () => {
    expect(isNavigationRequest({ mode: "navigate" } as Request)).toBe(true);
  });

  it("rejects non-navigation modes", () => {
    expect(isNavigationRequest({ mode: "no-cors" } as Request)).toBe(false);
  });
});

describe("sw-cache-policy: isRuntimeCacheable", () => {
  it("accepts a successful same-origin GET to an immutable static asset", () => {
    const request = makeRequest(`${ORIGIN}/_next/static/chunks/main.js`);
    const response = makeResponse({ status: 200 });
    expect(isRuntimeCacheable(request, response, ORIGIN)).toBe(true);
  });

  it("rejects non-GET requests", () => {
    const request = makeRequest(`${ORIGIN}/_next/static/chunks/main.js`, { method: "POST" });
    const response = makeResponse({ status: 200 });
    expect(isRuntimeCacheable(request, response, ORIGIN)).toBe(false);
  });

  it("rejects cross-origin requests", () => {
    const request = makeRequest("https://stripe.com/_next/static/chunks/main.js");
    const response = makeResponse({ status: 200 });
    expect(isRuntimeCacheable(request, response, ORIGIN)).toBe(false);
  });

  it("rejects paths outside the allowlist", () => {
    for (const pathname of ["/api/campaign", "/admin", "/admin/export", "/success/abc", "/mock-checkout/abc", "/", "/offline"]) {
      const request = makeRequest(`${ORIGIN}${pathname}`);
      const response = makeResponse({ status: 200 });
      expect(isRuntimeCacheable(request, response, ORIGIN)).toBe(false);
    }
  });

  it("rejects a failed (non-2xx) response", () => {
    const request = makeRequest(`${ORIGIN}/_next/static/chunks/main.js`);
    const response = makeResponse({ status: 500 });
    expect(isRuntimeCacheable(request, response, ORIGIN)).toBe(false);
  });

  it("rejects a redirected response", () => {
    const request = makeRequest(`${ORIGIN}/_next/static/chunks/main.js`);
    const response = makeResponse({ status: 200, redirected: true });
    expect(isRuntimeCacheable(request, response, ORIGIN)).toBe(false);
  });

  it("rejects an opaque or opaqueredirect response", () => {
    const request = makeRequest(`${ORIGIN}/_next/static/chunks/main.js`);
    expect(isRuntimeCacheable(request, makeResponse({ status: 200, type: "opaque" }), ORIGIN)).toBe(false);
    expect(isRuntimeCacheable(request, makeResponse({ status: 200, type: "opaqueredirect" }), ORIGIN)).toBe(false);
  });

  it("rejects when there is no response at all", () => {
    const request = makeRequest(`${ORIGIN}/_next/static/chunks/main.js`);
    expect(isRuntimeCacheable(request, undefined as unknown as Response, ORIGIN)).toBe(false);
  });
});
