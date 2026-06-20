import { beforeEach, describe, expect, it, vi } from "vitest";
import { PRECACHE_NAME, PRECACHE_URLS, RUNTIME_CACHE_NAME } from "./sw-cache-policy.js";

const ORIGIN = "https://example.test";

function createFakeCache() {
  const store = new Map<string, Response>();
  return {
    match: vi.fn(async (request: Request | string) => {
      const key = typeof request === "string" ? request : new URL(request.url).pathname;
      return store.get(key);
    }),
    put: vi.fn(async (request: Request | string, response: Response) => {
      const key = typeof request === "string" ? request : new URL(request.url).pathname;
      store.set(key, response);
    }),
    addAll: vi.fn(async (urls: string[]) => {
      for (const url of urls) store.set(url, new Response(`cached:${url}`));
    }),
    _store: store,
  };
}

function createFakeCacheStorage(initialCacheNames: string[] = []) {
  const cacheMap = new Map<string, ReturnType<typeof createFakeCache>>();
  for (const name of initialCacheNames) cacheMap.set(name, createFakeCache());

  return {
    open: vi.fn(async (name: string) => {
      if (!cacheMap.has(name)) cacheMap.set(name, createFakeCache());
      return cacheMap.get(name)!;
    }),
    keys: vi.fn(async () => Array.from(cacheMap.keys())),
    delete: vi.fn(async (name: string) => cacheMap.delete(name)),
    _cacheMap: cacheMap,
  };
}

type Listener = (event: unknown) => unknown;

let listeners: Record<string, Listener>;
let fakeCaches: ReturnType<typeof createFakeCacheStorage>;
let fakeFetch: ReturnType<typeof vi.fn>;

async function loadServiceWorker() {
  listeners = {};
  fakeCaches = createFakeCacheStorage();
  fakeFetch = vi.fn();

  vi.stubGlobal("self", {
    addEventListener: (type: string, handler: Listener) => {
      listeners[type] = handler;
    },
    location: { origin: ORIGIN },
  });
  vi.stubGlobal("caches", fakeCaches);
  vi.stubGlobal("fetch", fakeFetch);

  vi.resetModules();
  await import("./sw.js");
}

// Real browsers (and Node's undici-based Request) refuse to construct a
// Request with mode: "navigate" directly — it's a browser-internal-only
// mode the platform sets for actual navigations. sw.js only ever reads
// .method/.url/.mode off the request for this path, so a plain object
// standing in for one is sufficient and avoids that platform restriction.
function makeNavigationRequest(url: string): Request {
  return { method: "GET", url, mode: "navigate" } as unknown as Request;
}

function makeFetchEvent(request: Request) {
  let responsePromise: Promise<Response> | undefined;
  return {
    request,
    respondWith: (promise: Promise<Response>) => {
      responsePromise = promise;
    },
    getResponse: () => responsePromise,
  };
}

function makeLifecycleEvent() {
  let waited: Promise<unknown> = Promise.resolve();
  return {
    waitUntil: (promise: Promise<unknown>) => {
      waited = promise;
    },
    getWaited: () => waited,
  };
}

beforeEach(async () => {
  await loadServiceWorker();
});

describe("sw.js: install", () => {
  it("precaches exactly the known-safe static URLs", async () => {
    const event = makeLifecycleEvent();
    listeners.install(event);
    await event.getWaited();

    const cache = await fakeCaches.open(PRECACHE_NAME);
    expect(cache.addAll).toHaveBeenCalledWith(PRECACHE_URLS);
  });
});

describe("sw.js: activate", () => {
  it("deletes obsolete ONE MILLION caches", async () => {
    fakeCaches = createFakeCacheStorage(["one-million-precache-v0", "one-million-runtime-v0", PRECACHE_NAME, RUNTIME_CACHE_NAME]);
    vi.stubGlobal("caches", fakeCaches);

    const event = makeLifecycleEvent();
    listeners.activate(event);
    await event.getWaited();

    expect(fakeCaches.delete).toHaveBeenCalledWith("one-million-precache-v0");
    expect(fakeCaches.delete).toHaveBeenCalledWith("one-million-runtime-v0");
  });

  it("retains the current ONE MILLION caches", async () => {
    fakeCaches = createFakeCacheStorage(["one-million-precache-v0", PRECACHE_NAME, RUNTIME_CACHE_NAME]);
    vi.stubGlobal("caches", fakeCaches);

    const event = makeLifecycleEvent();
    listeners.activate(event);
    await event.getWaited();

    expect(fakeCaches.delete).not.toHaveBeenCalledWith(PRECACHE_NAME);
    expect(fakeCaches.delete).not.toHaveBeenCalledWith(RUNTIME_CACHE_NAME);
  });

  it("retains unrelated cache names that don't belong to this app", async () => {
    fakeCaches = createFakeCacheStorage(["workbox-precache-v2", "some-other-app-cache", PRECACHE_NAME, RUNTIME_CACHE_NAME]);
    vi.stubGlobal("caches", fakeCaches);

    const event = makeLifecycleEvent();
    listeners.activate(event);
    await event.getWaited();

    expect(fakeCaches.delete).not.toHaveBeenCalledWith("workbox-precache-v2");
    expect(fakeCaches.delete).not.toHaveBeenCalledWith("some-other-app-cache");
  });

  it("never deletes an empty or unexpected cache name merely because it isn't current", async () => {
    fakeCaches = createFakeCacheStorage(["", "totally-unexpected-name", PRECACHE_NAME, RUNTIME_CACHE_NAME]);
    vi.stubGlobal("caches", fakeCaches);

    const event = makeLifecycleEvent();
    listeners.activate(event);
    await event.getWaited();

    expect(fakeCaches.delete).not.toHaveBeenCalledWith("");
    expect(fakeCaches.delete).not.toHaveBeenCalledWith("totally-unexpected-name");
  });
});

describe("sw.js: fetch — non-GET and cross-origin pass through untouched", () => {
  it("never calls respondWith for a non-GET request", () => {
    const request = new Request(`${ORIGIN}/api/checkout`, { method: "POST" });
    const event = makeFetchEvent(request);
    listeners.fetch(event);
    expect(event.getResponse()).toBeUndefined();
  });

  it("never calls respondWith for a cross-origin request", () => {
    const request = new Request("https://stripe.com/checkout");
    const event = makeFetchEvent(request);
    listeners.fetch(event);
    expect(event.getResponse()).toBeUndefined();
  });
});

describe("sw.js: fetch — paths outside the allowlist pass through untouched", () => {
  it.each([
    "/admin",
    "/admin/export",
    "/api/campaign",
    "/api/checkout",
    "/api/webhooks/stripe",
    "/api/contributions/abc/status",
    "/api/share/abc",
    "/mock-checkout/abc",
    "/success/abc",
  ])("never intercepts %s", (pathname) => {
    const request = new Request(`${ORIGIN}${pathname}`, { mode: "same-origin" as RequestMode });
    const event = makeFetchEvent(request);
    listeners.fetch(event);
    expect(event.getResponse()).toBeUndefined();
  });
});

describe("sw.js: fetch — navigation", () => {
  it("uses the network first for a normal navigation", async () => {
    const networkResponse = new Response("live page");
    fakeFetch.mockResolvedValue(networkResponse);

    const request = makeNavigationRequest(`${ORIGIN}/`);
    const event = makeFetchEvent(request);
    listeners.fetch(event);

    const response = await event.getResponse();
    expect(response).toBe(networkResponse);
    expect(fakeFetch).toHaveBeenCalledWith(request);
  });

  it("falls back to the cached /offline page only when the network fetch genuinely fails", async () => {
    fakeFetch.mockRejectedValue(new TypeError("network error"));
    const precache = await fakeCaches.open(PRECACHE_NAME);
    const offlineResponse = new Response("offline page");
    await precache.put("/offline", offlineResponse);

    const request = makeNavigationRequest(`${ORIGIN}/some/page`);
    const event = makeFetchEvent(request);
    listeners.fetch(event);

    const response = await event.getResponse();
    expect(response).toBe(offlineResponse);
  });

  it("never serves a stale cached copy of a normal page when the network succeeds", async () => {
    const precache = await fakeCaches.open(PRECACHE_NAME);
    await precache.put("/some/page", new Response("STALE"));
    const freshResponse = new Response("FRESH");
    fakeFetch.mockResolvedValue(freshResponse);

    const request = makeNavigationRequest(`${ORIGIN}/some/page`);
    const event = makeFetchEvent(request);
    listeners.fetch(event);

    const response = await event.getResponse();
    expect(response).toBe(freshResponse);
  });
});

describe("sw.js: fetch — immutable static assets", () => {
  it("serves from the runtime cache when already cached", async () => {
    const runtimeCache = await fakeCaches.open(RUNTIME_CACHE_NAME);
    const cachedResponse = new Response("cached chunk");
    const request = new Request(`${ORIGIN}/_next/static/chunks/main.js`);
    await runtimeCache.put(request, cachedResponse);

    const event = makeFetchEvent(request);
    listeners.fetch(event);

    const response = await event.getResponse();
    expect(response).toBe(cachedResponse);
    expect(fakeFetch).not.toHaveBeenCalled();
  });

  it("fetches and caches on a cache miss for a successful response", async () => {
    const networkResponse = new Response("chunk", { status: 200 });
    fakeFetch.mockResolvedValue(networkResponse);

    const request = new Request(`${ORIGIN}/_next/static/chunks/main.js`);
    const event = makeFetchEvent(request);
    listeners.fetch(event);
    await event.getResponse();

    const runtimeCache = await fakeCaches.open(RUNTIME_CACHE_NAME);
    expect(runtimeCache.put).toHaveBeenCalled();
  });

  it("never caches a failed response for a static asset", async () => {
    const failedResponse = new Response("error", { status: 500 });
    fakeFetch.mockResolvedValue(failedResponse);

    const request = new Request(`${ORIGIN}/_next/static/chunks/main.js`);
    const event = makeFetchEvent(request);
    listeners.fetch(event);
    await event.getResponse();

    const runtimeCache = await fakeCaches.open(RUNTIME_CACHE_NAME);
    expect(runtimeCache.put).not.toHaveBeenCalled();
  });
});
