import { parseDollarsToCents } from "@/lib/money";

/**
 * $10,000,000 — well within Postgres/Prisma's Int range (max ~$21.47M for a
 * 32-bit signed integer of cents), generous for testing or future operation
 * while still bounded against an accidental or malicious absurd value.
 */
export const MAX_TARGET_CENTS = 1_000_000_000;

export type TargetValidationResult =
  | { ok: true; targetCents: number }
  | { ok: false; error: string };

/**
 * Validates a decimal-dollar string for the campaign target, converting it
 * to integer cents without any floating-point storage step.
 * parseDollarsToCents already rejects malformed input and anything with
 * more than two decimal places.
 */
export function validateNewTarget(
  input: string,
  currentConfirmedAmountCents: number,
): TargetValidationResult {
  const cents = parseDollarsToCents(input);

  if (cents === null || !Number.isSafeInteger(cents)) {
    return { ok: false, error: "Enter a valid dollar amount, e.g. 1000000 or 1000000.00." };
  }

  if (cents <= 0) {
    return { ok: false, error: "The target must be greater than zero." };
  }

  if (cents < currentConfirmedAmountCents) {
    return { ok: false, error: "The target cannot be lower than the amount already confirmed." };
  }

  if (cents > MAX_TARGET_CENTS) {
    return {
      ok: false,
      error: `The target cannot exceed $${(MAX_TARGET_CENTS / 100).toLocaleString("en-US")}.`,
    };
  }

  return { ok: true, targetCents: cents };
}
