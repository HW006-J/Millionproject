import type { NextConfig } from "next";
import { buildSecurityHeaders, buildServiceWorkerHeaders } from "./src/lib/securityHeaders";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: buildSecurityHeaders(),
      },
      {
        // Defense in depth on top of each route's own dynamic rendering /
        // explicit Cache-Control — never let an intermediary cache API
        // responses.
        source: "/api/:path*",
        headers: [{ key: "Cache-Control", value: "no-store" }],
      },
      {
        // Same for admin pages and the CSV export.
        source: "/admin/:path*",
        headers: [{ key: "Cache-Control", value: "no-store" }],
      },
      {
        // More specific than "/(.*)" above, so this overrides its
        // Content-Security-Policy and adds the rest on top.
        source: "/sw.js",
        headers: buildServiceWorkerHeaders(),
      },
    ];
  },
};

export default nextConfig;
