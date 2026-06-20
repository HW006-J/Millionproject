// Plain ES module, no build step: this file is loaded directly by the
// browser as part of the service worker (public/sw.js imports it) AND
// imported directly by the test suite (sw-cache-policy.test.ts). That's the
// single source of truth for the allowlist — there is deliberately no
// second copy of this logic anywhere.

// Every cache this app owns is named under this prefix, and only names
// under this prefix are ever eligible for deletion during activation — an
// unrelated cache on the same origin (a different app/library/future
// feature) must never be touched, even if it isn't "current".
export const CACHE_PREFIX = "one-million-";
export const CACHE_VERSION = "v1";

// Separately named so the offline shell (small, rarely-changing) and
// runtime-cached static assets (larger, grows over time) can be reasoned
// about and cleared independently if ever needed.
export const PRECACHE_NAME = `${CACHE_PREFIX}precache-${CACHE_VERSION}`;
export const RUNTIME_CACHE_NAME = `${CACHE_PREFIX}runtime-${CACHE_VERSION}`;

// Known-safe, explicitly listed static resources only. Never list a
// /_next/static/ URL here — those are content-hashed per build and unknown
// at install time; they are only ever added to the runtime cache below,
// and only after a successful network response.
export const PRECACHE_URLS = ["/offline", "/manifest.webmanifest", "/icons/icon-192.png", "/icons/icon-512.png"];

// Defensive double-check only — isImmutableStaticAsset() below is the real
// (allowlist) gate for runtime caching, so nothing under these prefixes
// should ever reach this check in normal operation.
const NEVER_CACHE_PREFIXES = ["/admin", "/api", "/mock-checkout", "/success"];

export function isNeverCachePath(pathname) {
  return NEVER_CACHE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

// The allowlist: the only paths eligible for runtime caching at all.
// Hashed Next.js build assets are immutable — a new deploy produces new
// filenames, so caching them indefinitely is safe.
export function isImmutableStaticAsset(pathname) {
  return pathname.startsWith("/_next/static/");
}

export function isPrecacheUrl(pathname) {
  return PRECACHE_URLS.includes(pathname);
}

export function isSameOrigin(requestUrl, originUrl) {
  try {
    return new URL(requestUrl).origin === new URL(originUrl).origin;
  } catch {
    return false;
  }
}

export function isNavigationRequest(request) {
  return request.mode === "navigate";
}

/** Whether a cache name belongs to this app at all (vs. an unrelated cache on the same origin). */
export function isOwnedCacheName(name) {
  return typeof name === "string" && name.startsWith(CACHE_PREFIX);
}

/**
 * Whether a cache name is one of *this app's* caches that no longer
 * matches the current version, and should be deleted on activation. Never
 * true for a name that isn't owned by this app in the first place — an
 * empty string, an unexpected name, or another app/library's cache on the
 * same origin must never be deleted just because it doesn't equal one of
 * our current names.
 */
export function isObsoleteOwnedCache(name) {
  return isOwnedCacheName(name) && name !== PRECACHE_NAME && name !== RUNTIME_CACHE_NAME;
}

/**
 * Whether a fetched Response for a given GET request may be stored in the
 * runtime cache. Requires: same-origin GET, an allowlisted immutable-static
 * path, a successful (2xx) response, and not a redirect or opaque result.
 */
export function isRuntimeCacheable(request, response, originUrl) {
  if (!request || request.method !== "GET") return false;
  if (!isSameOrigin(request.url, originUrl)) return false;

  const pathname = new URL(request.url).pathname;
  if (!isImmutableStaticAsset(pathname)) return false;
  if (isNeverCachePath(pathname)) return false;

  if (!response || !response.ok) return false;
  if (response.redirected) return false;
  if (response.type === "opaqueredirect" || response.type === "opaque") return false;

  return true;
}
