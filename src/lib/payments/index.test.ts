import { afterEach, describe, expect, it, vi } from "vitest";
import { isMockModeAllowed } from "@/lib/payments";

describe("isMockModeAllowed", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("allows mock mode outside production", () => {
    vi.stubEnv("PAYMENTS_MODE", "mock");
    vi.stubEnv("NODE_ENV", "development");
    expect(isMockModeAllowed()).toBe(true);
  });

  it("blocks mock mode in production", () => {
    vi.stubEnv("PAYMENTS_MODE", "mock");
    vi.stubEnv("NODE_ENV", "production");
    expect(isMockModeAllowed()).toBe(false);
  });

  it("blocks mock mode when PAYMENTS_MODE is not mock", () => {
    vi.stubEnv("PAYMENTS_MODE", "stripe");
    vi.stubEnv("NODE_ENV", "development");
    expect(isMockModeAllowed()).toBe(false);
  });
});
