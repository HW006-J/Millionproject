import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { mockGetAuthSecret, mockVerifySessionToken } = vi.hoisted(() => ({
  mockGetAuthSecret: vi.fn(),
  mockVerifySessionToken: vi.fn(),
}));

vi.mock("@/lib/admin/session", () => ({
  SESSION_COOKIE_NAME: "admin_session",
  getAuthSecret: mockGetAuthSecret,
  verifySessionToken: mockVerifySessionToken,
}));

const { proxy } = await import("@/proxy");

beforeEach(() => {
  mockGetAuthSecret.mockReset();
  mockVerifySessionToken.mockReset();
});

function requestFor(path: string, cookieValue?: string) {
  const headers = new Headers();
  if (cookieValue) {
    headers.set("cookie", `admin_session=${cookieValue}`);
  }
  return new NextRequest(new URL(path, "http://localhost:3000"), { headers });
}

describe("proxy (optimistic check only)", () => {
  it("always allows /admin/login through, even without a cookie", () => {
    const response = proxy(requestFor("/admin/login"));
    expect(response.status).toBe(200); // NextResponse.next() reports 200
  });

  it("redirects to /admin/login when there is no cookie", () => {
    mockGetAuthSecret.mockReturnValue("secret");

    const response = proxy(requestFor("/admin"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/admin/login");
  });

  it("redirects to /admin/login when AUTH_SECRET is unavailable, even with a cookie present", () => {
    mockGetAuthSecret.mockReturnValue(null);

    const response = proxy(requestFor("/admin", "some-token"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/admin/login");
  });

  it("redirects to /admin/login when the cookie fails verification", () => {
    mockGetAuthSecret.mockReturnValue("secret");
    mockVerifySessionToken.mockReturnValue(null);

    const response = proxy(requestFor("/admin", "tampered-token"));

    expect(response.status).toBe(307);
  });

  it("allows the request through when the cookie verifies successfully", () => {
    mockGetAuthSecret.mockReturnValue("secret");
    mockVerifySessionToken.mockReturnValue({ adminId: "admin_1" });

    const response = proxy(requestFor("/admin", "good-token"));

    expect(response.status).toBe(200);
  });
});
