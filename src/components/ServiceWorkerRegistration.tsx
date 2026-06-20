"use client";

import { useEffect } from "react";

/**
 * Registers /sw.js only in production — registering during local
 * development would fight with Turbopack/HMR and could serve stale code
 * from a previous build. The entire PWA layer is enhancement-only, so
 * registration failures (unsupported browser, blocked, etc.) are swallowed
 * silently: nothing here may ever surface an error to a normal user, and
 * every feature of the app must keep working identically without it.
 *
 * type: "module" lets sw.js import its cache-policy logic from a shared
 * file instead of duplicating it. ES-module service-worker support varies
 * by browser version and must be tested in the current target browsers —
 * where it isn't supported, registration simply fails and is swallowed by
 * the .catch() below (no error, no degraded functionality; offline support
 * and install-ability just don't apply there yet).
 *
 * Exported separately from the component (rather than inlined in the
 * effect) so it has exactly one implementation that both the real app and
 * the test suite call — nothing here is duplicated for testing purposes.
 */
export function registerServiceWorker(): void {
  if (process.env.NODE_ENV !== "production") return;
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;

  navigator.serviceWorker
    .register("/sw.js", { scope: "/", type: "module", updateViaCache: "none" })
    .catch(() => {
      // Intentionally silent — see module doc comment above.
    });
}

export function ServiceWorkerRegistration() {
  useEffect(() => {
    registerServiceWorker();
  }, []);

  return null;
}
