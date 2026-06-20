const LEADING_WHITESPACE_PATTERN = /^[ \t\r\n]*/;
const DANGEROUS_MARKER_PATTERN = /^[=+\-@]/;

/**
 * Escapes a single CSV field: standard comma/quote/newline escaping, plus a
 * neutralizing prefix for values where a formula marker (=, +, -, @) would
 * be interpreted as a formula by Excel/Sheets/etc. when the file is opened.
 *
 * The marker check looks *past* any leading spaces, tabs, carriage returns,
 * or newlines before testing for =, +, -, @ — naive filters that only check
 * the literal first character of the raw string can be bypassed by a value
 * like " =cmd(...)" or "\t=cmd(...)", since spreadsheet applications can
 * still treat those as formulas. When a marker is found (with or without
 * leading whitespace), a neutralizing `'` is prepended at the very start of
 * the field — a leading `'` forces an entire spreadsheet cell into literal
 * text mode, so it's safe regardless of what precedes the marker.
 */
export function escapeCsvField(value: string): string {
  let sanitized = value;

  const leadingWhitespaceLength = sanitized.match(LEADING_WHITESPACE_PATTERN)?.[0].length ?? 0;
  const afterLeadingWhitespace = sanitized.slice(leadingWhitespaceLength);

  if (DANGEROUS_MARKER_PATTERN.test(afterLeadingWhitespace)) {
    sanitized = `'${sanitized}`;
  }

  if (/[",\r\n]/.test(sanitized)) {
    sanitized = `"${sanitized.replace(/"/g, '""')}"`;
  }

  return sanitized;
}

export function toCsvRow(fields: Array<string | number | boolean | null | undefined>): string {
  return fields.map((field) => escapeCsvField(String(field ?? ""))).join(",") + "\r\n";
}

export function buildCsv(
  headers: string[],
  rows: Array<Array<string | number | boolean | null | undefined>>,
): string {
  let csv = toCsvRow(headers);
  for (const row of rows) {
    csv += toCsvRow(row);
  }
  return csv;
}
