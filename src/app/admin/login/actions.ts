"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { attemptAdminLogin } from "@/lib/admin/login";
import {
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
  createSessionToken,
  getAuthSecret,
} from "@/lib/admin/session";

const GENERIC_LOGIN_ERROR = "Invalid email or password.";

export interface LoginActionResult {
  error?: string;
}

export async function loginAction(
  _prevState: LoginActionResult,
  formData: FormData,
): Promise<LoginActionResult> {
  const secret = getAuthSecret();
  if (!secret) {
    return { error: "Admin login is not available." };
  }

  const email = formData.get("email");
  const password = formData.get("password");

  if (
    typeof email !== "string" ||
    typeof password !== "string" ||
    email.trim().length === 0 ||
    password.length === 0
  ) {
    return { error: GENERIC_LOGIN_ERROR };
  }

  const result = await attemptAdminLogin(email.trim().toLowerCase(), password);

  if (result.status !== "success") {
    // Deliberately the same message for "no such email", "wrong password",
    // and "locked" — never reveal which case occurred.
    return { error: GENERIC_LOGIN_ERROR };
  }

  const token = createSessionToken(result.adminId, secret);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });

  redirect("/admin");
}
