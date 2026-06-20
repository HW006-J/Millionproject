import { describe, expect, it } from "vitest";
import {
  containsProfanity,
  sanitizePublicName,
  validatePublicName,
} from "@/lib/publicName";

describe("sanitizePublicName", () => {
  it("trims surrounding whitespace", () => {
    expect(sanitizePublicName("  Henry  ")).toBe("Henry");
  });

  it("collapses repeated internal whitespace", () => {
    expect(sanitizePublicName("Henry    White")).toBe("Henry White");
  });

  it("truncates names longer than the limit", () => {
    const longName = "a".repeat(50);
    expect(sanitizePublicName(longName)).toHaveLength(30);
  });
});

describe("containsProfanity", () => {
  it("flags a blocked word", () => {
    expect(containsProfanity("you are a bitch")).toBe(true);
  });

  it("is case-insensitive", () => {
    expect(containsProfanity("FUCK this")).toBe(true);
  });

  it("allows clean names", () => {
    expect(containsProfanity("Henry White")).toBe(false);
  });
});

describe("validatePublicName", () => {
  it("allows anonymous with no name required", () => {
    const result = validatePublicName({ isAnonymous: true });
    expect(result).toEqual({
      ok: true,
      value: { isAnonymous: true, publicName: null },
    });
  });

  it("rejects an empty name when not anonymous", () => {
    const result = validatePublicName({ isAnonymous: false, customName: "   " });
    expect(result.ok).toBe(false);
  });

  it("rejects a name containing profanity", () => {
    const result = validatePublicName({
      isAnonymous: false,
      customName: "shit head",
    });
    expect(result.ok).toBe(false);
  });

  it("accepts and sanitizes a valid name", () => {
    const result = validatePublicName({
      isAnonymous: false,
      customName: "  Henry  ",
    });
    expect(result).toEqual({
      ok: true,
      value: { isAnonymous: false, publicName: "Henry" },
    });
  });
});
