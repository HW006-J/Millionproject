import { describe, expect, it } from "vitest";
import {
  MAX_CONTRIBUTION_CENTS,
  MIN_CONTRIBUTION_CENTS,
  formatCents,
  isValidCustomAmountCents,
  parseDollarsToCents,
} from "@/lib/money";

describe("parseDollarsToCents", () => {
  it("converts whole dollars to cents", () => {
    expect(parseDollarsToCents("10")).toBe(1000);
  });

  it("converts decimal dollars to cents", () => {
    expect(parseDollarsToCents("1.50")).toBe(150);
  });

  it("rejects more than two decimal places", () => {
    expect(parseDollarsToCents("1.005")).toBeNull();
  });

  it("rejects non-numeric input", () => {
    expect(parseDollarsToCents("abc")).toBeNull();
  });

  it("rejects negative numbers", () => {
    expect(parseDollarsToCents("-5")).toBeNull();
  });
});

describe("formatCents", () => {
  it("formats cents as a dollar string", () => {
    expect(formatCents(150)).toBe("$1.50");
  });

  it("formats large amounts with thousands separators", () => {
    expect(formatCents(100_000_000)).toBe("$1,000,000.00");
  });
});

describe("isValidCustomAmountCents", () => {
  it("accepts the minimum amount", () => {
    expect(isValidCustomAmountCents(MIN_CONTRIBUTION_CENTS)).toBe(true);
  });

  it("accepts the maximum amount", () => {
    expect(isValidCustomAmountCents(MAX_CONTRIBUTION_CENTS)).toBe(true);
  });

  it("rejects amounts below the minimum", () => {
    expect(isValidCustomAmountCents(MIN_CONTRIBUTION_CENTS - 1)).toBe(false);
  });

  it("rejects amounts above the maximum", () => {
    expect(isValidCustomAmountCents(MAX_CONTRIBUTION_CENTS + 1)).toBe(false);
  });

  it("rejects null", () => {
    expect(isValidCustomAmountCents(null)).toBe(false);
  });
});
