import { describe, expect, it } from "vitest";
import { MAX_TARGET_CENTS, validateNewTarget } from "@/lib/admin/target";

describe("validateNewTarget", () => {
  it("accepts a valid whole-dollar target above the confirmed amount", () => {
    expect(validateNewTarget("2000000", 100)).toEqual({ ok: true, targetCents: 200_000_000 });
  });

  it("accepts a valid target with cents", () => {
    expect(validateNewTarget("1000000.50", 0)).toEqual({ ok: true, targetCents: 100_000_050 });
  });

  it("rejects malformed input", () => {
    expect(validateNewTarget("not-a-number", 0).ok).toBe(false);
  });

  it("rejects more than two decimal places", () => {
    expect(validateNewTarget("1000000.123", 0).ok).toBe(false);
  });

  it("rejects a negative amount", () => {
    expect(validateNewTarget("-500", 0).ok).toBe(false);
  });

  it("rejects zero", () => {
    expect(validateNewTarget("0", 0).ok).toBe(false);
  });

  it("rejects a target below the current confirmed amount", () => {
    const result = validateNewTarget("100", 100_000);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/lower than the amount already confirmed/);
    }
  });

  it("accepts a target exactly equal to the current confirmed amount", () => {
    expect(validateNewTarget("1.00", 100)).toEqual({ ok: true, targetCents: 100 });
  });

  it("rejects a target above the documented upper bound", () => {
    const result = validateNewTarget("50000000", 0);
    expect(result.ok).toBe(false);
  });

  it("accepts a target exactly at the upper bound", () => {
    const dollars = (MAX_TARGET_CENTS / 100).toString();
    expect(validateNewTarget(dollars, 0)).toEqual({ ok: true, targetCents: MAX_TARGET_CENTS });
  });

  it("never produces a non-integer cents value", () => {
    const result = validateNewTarget("1000000.99", 0);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(Number.isInteger(result.targetCents)).toBe(true);
    }
  });
});
