import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME, getAuthSecret, verifySessionToken } from "@/lib/admin/session";

export const config = {
  matcher: ["/admin/:path*"],
};

/**
 * Optimistic only: a fast, cookie-only check to redirect obviously
 * unauthenticated requests away from /admin before they hit a page. This is
 * NOT the security boundary — it never queries the database, so it can't
 * detect a deleted admin account or other server-side state. Every
 * protected page, Server Action, and Route Handler independently calls
 * verifyAdminSession()/requireAdmin() (see src/lib/admin/auth.ts), which is
 * the real authorization check.
 */
export function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === "/admin/login") {
    return NextResponse.next();
  }

  const secret = getAuthSecret();
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (secret && token && verifySessionToken(token, secret)) {
    return NextResponse.next();
  }

  return NextResponse.redirect(new URL("/admin/login", request.url));
}
