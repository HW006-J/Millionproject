import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockCookieSet, mockGetAuthSecret, mockCreateSessionToken, mockAttemptAdminLogin, mockRedirect } =
  vi.hoisted(() => ({
    mockCookieSet: vi.fn(),
    mockGetAuthSecret: vi.fn(),
    mockCreateSessionToken: vi.fn(),
    mockAttemptAdminLogin: vi.fn(),
    mockRedirect: vi.fn((url: string) => {
      throw new Error(`REDIRECT:${url}`);
    }),
  }));

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({ set: mockCookieSet })),
}));

vi.mock("next/navigation", () => ({
  redirect: mockRedirect,
}));

vi.mock("@/lib/admin/login", () => ({
  attemptAdminLogin: mockAttemptAdminLogin,
}));

vi.mock("@/lib/admin/session", () => ({
  SESSION_COOKIE_NAME: "admin_session",
  SESSION_MAX_AGE_SECONDS: 8 * 60 * 60,
  createSessionToken: mockCreateSessionToken,
  getAuthSecret: mockGetAuthSecret,
}));

const { loginAction } = await import("@/app/admin/login/actions");

function formDataWith(email: string, password: string) {
  const formData = new FormData();
  formData.set("email", email);
  formData.set("password", password);
  return formData;
}

beforeEach(() => {
  mockCookieSet.mockReset();
  mockGetAuthSecret.mockReset();
  mockCreateSessionToken.mockReset();
  mockAttemptAdminLogin.mockReset();
  mockRedirect.mockClear();
  vi.unstubAllEnvs();
});

describe("loginAction", () => {
  it("fails closed with a generic message when AUTH_SECRET is unavailable", async () => {
    mockGetAuthSecret.mockReturnValue(null);

    const result = await loginAction({}, formDataWith("admin@example.com", "password123456"));

    expect(result.error).toBeTruthy();
    expect(mockAttemptAdminLogin).not.toHaveBeenCalled();
    expect(mockCookieSet).not.toHaveBeenCalled();
  });

  it("returns the same generic error for an unknown email as for a wrong password", async () => {
    mockGetAuthSecret.mockReturnValue("secret");
    mockAttemptAdminLogin.mockResolvedValue({ status: "invalid_credentials" });

    const unknownEmailResult = await loginAction({}, formDataWith("nobody@example.com", "whatever123"));
    const wrongPasswordResult = await loginAction({}, formDataWith("admin@example.com", "wrong12345"));

    expect(unknownEmailResult.error).toBe(wrongPasswordResult.error);
  });

  it("returns the same generic error when the account is locked", async () => {
    mockGetAuthSecret.mockReturnValue("secret");
    mockAttemptAdminLogin.mockResolvedValue({ status: "locked" });

    const result = await loginAction({}, formDataWith("admin@example.com", "whatever123"));

    expect(result.error).toBeTruthy();
    expect(mockCookieSet).not.toHaveBeenCalled();
  });

  it("sets a correctly-configured cookie and redirects to /admin on success", async () => {
    mockGetAuthSecret.mockReturnValue("secret");
    mockAttemptAdminLogin.mockResolvedValue({ status: "success", adminId: "admin_1" });
    mockCreateSessionToken.mockReturnValue("signed-token");
    vi.stubEnv("NODE_ENV", "production");

    await expect(
      loginAction({}, formDataWith("Admin@Example.com", "correct-password")),
    ).rejects.toThrow("REDIRECT:/admin");

    expect(mockAttemptAdminLogin).toHaveBeenCalledWith("admin@example.com", "correct-password");
    expect(mockCookieSet).toHaveBeenCalledWith("admin_session", "signed-token", {
      httpOnly: true,
      sameSite: "strict",
      secure: true,
      path: "/",
      maxAge: 8 * 60 * 60,
    });
  });

  it("rejects an empty email or password before calling attemptAdminLogin", async () => {
    mockGetAuthSecret.mockReturnValue("secret");

    const result = await loginAction({}, formDataWith("", ""));

    expect(result.error).toBeTruthy();
    expect(mockAttemptAdminLogin).not.toHaveBeenCalled();
  });
});
