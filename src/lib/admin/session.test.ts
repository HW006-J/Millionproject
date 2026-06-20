import { createHmac } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createSessionToken,
  getAuthSecret,
  verifySessionToken,
} from "@/lib/admin/session";

const SECRET = "a".repeat(32);

describe("getAuthSecret", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns null when AUTH_SECRET is missing", () => {
    vi.stubEnv("AUTH_SECRET", "");
    expect(getAuthSecret()).toBeNull();
  });

  it("returns null when AUTH_SECRET is too short", () => {
    vi.stubEnv("AUTH_SECRET", "too-short");
    expect(getAuthSecret()).toBeNull();
  });

  it("returns the secret when it meets the minimum length", () => {
    vi.stubEnv("AUTH_SECRET", SECRET);
    expect(getAuthSecret()).toBe(SECRET);
  });
});

describe("createSessionToken / verifySessionToken", () => {
  it("creates a token that verifies successfully and returns the admin id", () => {
    const token = createSessionToken("admin_1", SECRET);
    const result = verifySessionToken(token, SECRET);
    expect(result).toEqual({ adminId: "admin_1" });
  });

  it("rejects a session past its expiry", () => {
    const now = Date.now();
    const token = createSessionToken("admin_1", SECRET, now);
    const eightHoursAndOneSecondLater = now + 8 * 60 * 60 * 1000 + 1000;
    expect(verifySessionToken(token, SECRET, eightHoursAndOneSecondLater)).toBeNull();
  });

  it("accepts a session just before its expiry", () => {
    const now = Date.now();
    const token = createSessionToken("admin_1", SECRET, now);
    const justBeforeExpiry = now + 8 * 60 * 60 * 1000 - 1000;
    expect(verifySessionToken(token, SECRET, justBeforeExpiry)).toEqual({ adminId: "admin_1" });
  });

  it("rejects a malformed token (no signature segment)", () => {
    expect(verifySessionToken("not-a-valid-token", SECRET)).toBeNull();
  });

  it("rejects a malformed token (invalid base64 payload)", () => {
    expect(verifySessionToken("!!!.!!!", SECRET)).toBeNull();
  });

  it("rejects an empty token", () => {
    expect(verifySessionToken("", SECRET)).toBeNull();
  });

  it("rejects a token tampered with after signing", () => {
    const token = createSessionToken("admin_1", SECRET);
    const [payload, signature] = token.split(".");
    const tamperedPayload = Buffer.from(
      JSON.stringify({ v: 1, sub: "someone_else", iat: Date.now(), exp: Date.now() + 1_000_000 }),
    ).toString("base64url");
    const tamperedToken = `${tamperedPayload}.${signature}`;
    expect(verifySessionToken(tamperedToken, SECRET)).toBeNull();
    expect(payload).not.toBe(tamperedPayload);
  });

  it("rejects a token signed with a different secret", () => {
    const token = createSessionToken("admin_1", SECRET);
    const otherSecret = "b".repeat(32);
    expect(verifySessionToken(token, otherSecret)).toBeNull();
  });

  it("rejects a token with an unrecognized version", () => {
    const now = Date.now();
    const payload = Buffer.from(
      JSON.stringify({ v: 999, sub: "admin_1", iat: now, exp: now + 1_000_000 }),
    ).toString("base64url");
    // Re-sign with the same secret so only the version is wrong.
    const signature = createHmac("sha256", SECRET).update(payload).digest("base64url");
    expect(verifySessionToken(`${payload}.${signature}`, SECRET)).toBeNull();
  });
});
