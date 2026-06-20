export interface HeaderEntry {
  key: string;
  value: string;
}

function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

/**
 * No nonces. Next.js App Router's RSC hydration payload requires inline
 * <script> tags, and this app's progress-bar/chart components use inline
 * style={{ width }} attributes — both need 'unsafe-inline' here. Nonce-based
 * CSP would let script-src drop 'unsafe-inline', but Next.js's own docs are
 * explicit that nonces require generating a fresh value in Proxy on every
 * request *and* forcing every page into dynamic rendering — a real
 * architectural cost this app's current threat model doesn't justify.
 * 'unsafe-eval' is added only in development, where React requires it for
 * dev-mode server-error reconstruction; it is never present in production.
 */
export function buildContentSecurityPolicy(): string {
  const production = isProduction();

  const directives = [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "img-src 'self' data:",
    "font-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    `script-src 'self' 'unsafe-inline'${production ? "" : " 'unsafe-eval'"}`,
    "connect-src 'self'",
  ];

  if (production) {
    directives.push("upgrade-insecure-requests");
  }

  return directives.join("; ");
}

export function buildSecurityHeaders(): HeaderEntry[] {
  const headers: HeaderEntry[] = [
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    {
      key: "Permissions-Policy",
      value: "camera=(), microphone=(), geolocation=(), payment=()",
    },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Content-Security-Policy", value: buildContentSecurityPolicy() },
  ];

  // HSTS only makes sense over a real HTTPS deployment. Local dev runs over
  // plain HTTP, where this header would be actively counterproductive
  // (telling the browser to demand HTTPS for localhost). Deployment-level
  // HTTPS termination (e.g. Vercel) is what makes this meaningful.
  //
  // Deliberately just `max-age` (1 year) for now — no `includeSubDomains`,
  // no `preload`. Both apply HSTS beyond this exact host (every subdomain,
  // and browser preload lists that are slow/impossible to reverse) and
  // should only be turned on once the final production domain *and every
  // subdomain that will ever be served* are confirmed to support HTTPS
  // permanently. Turning either on prematurely can lock out a future HTTP
  // subdomain or a domain change for a very long time.
  if (isProduction()) {
    headers.push({
      key: "Strict-Transport-Security",
      value: "max-age=31536000",
    });
  }

  return headers;
}
