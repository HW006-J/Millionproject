import { createHmac, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE_NAME = "admin_session";

const SESSION_VERSION = 1;
const SESSION_LIFETIME_MS = 8 * 60 * 60 * 1000; // 8 hours
const MIN_AUTH_SECRET_LENGTH = 32;

export const SESSION_MAX_AGE_SECONDS = SESSION_LIFETIME_MS / 1000;

interface SessionPayload {
  v: number;
  sub: string;
  iat: number;
  exp: number;
}

/**
 * Reads and validates AUTH_SECRET. Returns null if it's missing or too short
 * — callers must fail closed (refuse to create or verify sessions) rather
 * than ever signing with a weak or absent secret.
 */
export function getAuthSecret(): string | null {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < MIN_AUTH_SECRET_LENGTH) {
    return null;
  }
  return secret;
}

function base64UrlEncode(input: string): string {
  return Buffer.from(input, "utf8").toString("base64url");
}

function base64UrlDecode(input: string): string | null {
  try {
    return Buffer.from(input, "base64url").toString("utf8");
  } catch {
    return null;
  }
}

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function createSessionToken(
  adminId: string,
  secret: string,
  now: number = Date.now(),
): string {
  const payload: SessionPayload = {
    v: SESSION_VERSION,
    sub: adminId,
    iat: now,
    exp: now + SESSION_LIFETIME_MS,
  };

  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = sign(encodedPayload, secret);
  return `${encodedPayload}.${signature}`;
}

/**
 * Verifies a session token's signature and expiry. Never throws — any
 * malformed, tampered, expired, or wrong-version token simply returns null.
 */
export function verifySessionToken(
  token: string,
  secret: string,
  now: number = Date.now(),
): { adminId: string } | null {
  if (typeof token !== "string" || token.length === 0) {
    return null;
  }

  const parts = token.split(".");
  if (parts.length !== 2) {
    return null;
  }

  const [encodedPayload, signature] = parts;
  const expectedSignature = sign(encodedPayload, secret);

  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    return null;
  }

  const decodedPayload = base64UrlDecode(encodedPayload);
  if (!decodedPayload) {
    return null;
  }

  let payload: unknown;
  try {
    payload = JSON.parse(decodedPayload);
  } catch {
    return null;
  }

  if (
    typeof payload !== "object" ||
    payload === null ||
    (payload as SessionPayload).v !== SESSION_VERSION ||
    typeof (payload as SessionPayload).sub !== "string" ||
    typeof (payload as SessionPayload).iat !== "number" ||
    typeof (payload as SessionPayload).exp !== "number"
  ) {
    return null;
  }

  const { sub, exp } = payload as SessionPayload;

  if (now >= exp) {
    return null;
  }

  return { adminId: sub };
}
