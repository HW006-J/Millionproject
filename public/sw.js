// Conservative, allowlist-based service worker. Registered as an ES module
// (see ServiceWorkerRegistration) so this can import its cache-policy logic
// from a single shared file rather than duplicating it — see
// sw-cache-policy.js for the real allowlist/denylist rules.
//
// Outside of navigation requests and immutable /_next/static/ assets, this
// worker never calls event.respondWith() at all — every other request
// (admin, api, checkout, success, webhooks, anything cross-origin or
// non-GET) is left completely untouched and handled by the browser exactly
// as if no service worker were installed.

import {
  PRECACHE_NAME,
  PRECACHE_URLS,
  RUNTIME_CACHE_NAME,
  isImmutableStaticAsset,
  isNavigationRequest,
  isObsoleteOwnedCache,
  isRuntimeCacheable,
  isSameOrigin,
} from "./sw-cache-policy.js";

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(PRECACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)));
});

self.addEventListener("activate", (event) => {
  // Only ever delete this app's own obsolete caches (names under
  // CACHE_PREFIX that aren't the current version) — never anything
  // unrelated that happens to share the origin.
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter(isObsoleteOwnedCache).map((key) => caches.delete(key)))),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Never touch non-GET requests (no caching, no interception at all) —
  // covers checkout submissions, webhook deliveries, and every form post.
  if (request.method !== "GET") return;

  // Never touch cross-origin requests (e.g. the eventual Stripe redirect).
  if (!isSameOrigin(request.url, self.location.origin)) return;

  if (isNavigationRequest(request)) {
    event.respondWith(handleNavigation(request));
    return;
  }

  const pathname = new URL(request.url).pathname;
  if (isImmutableStaticAsset(pathname)) {
    event.respondWith(handleStaticAsset(request));
    return;
  }

  // Everything else (admin, api, mock-checkout, success, and anything not
  // explicitly allowlisted above) is left alone entirely.
});

async function handleNavigation(request) {
  try {
    // Network first, always — never serve a stale cached copy of a normal
    // page. The cache is consulted only in the catch branch below, and
    // only for the dedicated offline fallback.
    return await fetch(request);
  } catch {
    const cache = await caches.open(PRECACHE_NAME);
    const offline = await cache.match("/offline");
    if (offline) return offline;
    throw new Error("Offline and no cached fallback is available.");
  }
}

async function handleStaticAsset(request) {
  const cache = await caches.open(RUNTIME_CACHE_NAME);
  const cached = await cache.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (isRuntimeCacheable(request, response, self.location.origin)) {
    cache.put(request, response.clone());
  }
  return response;
}
