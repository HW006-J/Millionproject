const CURRENCY_FORMATTER = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const TARGET_CENTS = 100_000_000;
export const MIN_CONTRIBUTION_CENTS = 100;
export const MAX_CONTRIBUTION_CENTS = 1_000_000;
export const PRESET_AMOUNTS_CENTS = [100, 500, 1000, 2500, 10000];

export function formatCents(cents: number): string {
  return CURRENCY_FORMATTER.format(cents / 100);
}

export function formatCentsWhole(cents: number): string {
  return `$${Math.round(cents / 100).toLocaleString("en-US")}`;
}

const DOLLARS_PATTERN = /^\d+(\.\d{1,2})?$/;

export function parseDollarsToCents(input: string): number | null {
  const trimmed = input.trim();
  if (!DOLLARS_PATTERN.test(trimmed)) {
    return null;
  }
  return Math.round(parseFloat(trimmed) * 100);
}

export function isValidCustomAmountCents(cents: number | null): boolean {
  return (
    cents !== null &&
    cents >= MIN_CONTRIBUTION_CENTS &&
    cents <= MAX_CONTRIBUTION_CENTS
  );
}
