import { describe, expect, it } from "vitest";
import { buildCsv, escapeCsvField, toCsvRow } from "@/lib/csv";

describe("escapeCsvField", () => {
  it("leaves a plain value untouched", () => {
    expect(escapeCsvField("Henry")).toBe("Henry");
  });

  it("quotes a value containing a comma", () => {
    expect(escapeCsvField("Smith, Henry")).toBe('"Smith, Henry"');
  });

  it("quotes and doubles embedded quotes", () => {
    expect(escapeCsvField('Say "hi"')).toBe('"Say ""hi"""');
  });

  it("quotes a value containing a newline", () => {
    expect(escapeCsvField("line1\nline2")).toBe('"line1\nline2"');
  });

  it("quotes a value containing a carriage return", () => {
    expect(escapeCsvField("line1\rline2")).toBe('"line1\rline2"');
  });

  for (const prefix of ["=", "+", "-", "@"]) {
    it(`neutralizes a formula-injection prefix "${prefix}"`, () => {
      const result = escapeCsvField(`${prefix}cmd|'/bin/sh'!A1`);
      expect(result.startsWith(`'${prefix}`)).toBe(true);
    });
  }

  it("does not alter a value that merely contains = in the middle", () => {
    expect(escapeCsvField("a=b")).toBe("a=b");
  });

  it("neutralizes a formula prefix and still quotes if it also has a comma", () => {
    const result = escapeCsvField("=SUM(A1,A2)");
    expect(result.startsWith('"\'=')).toBe(true);
    expect(result.endsWith('"')).toBe(true);
  });
});

function unwrapCsvQuoting(field: string): string {
  if (field.startsWith('"') && field.endsWith('"')) {
    return field.slice(1, -1).replace(/""/g, '"');
  }
  return field;
}

describe("escapeCsvField: formula marker hidden behind leading whitespace", () => {
  it("neutralizes a marker that is the very first character", () => {
    const result = unwrapCsvQuoting(escapeCsvField("=cmd|'/bin/sh'!A1"));
    expect(result).toBe("'=cmd|'/bin/sh'!A1");
  });

  it("neutralizes a marker after leading spaces", () => {
    const result = unwrapCsvQuoting(escapeCsvField("   =cmd|'/bin/sh'!A1"));
    expect(result).toBe("'   =cmd|'/bin/sh'!A1");
  });

  it("neutralizes a marker after a leading tab", () => {
    const result = unwrapCsvQuoting(escapeCsvField("\t=cmd|'/bin/sh'!A1"));
    expect(result).toBe("'\t=cmd|'/bin/sh'!A1");
  });

  it("neutralizes a marker after a leading carriage return", () => {
    const result = unwrapCsvQuoting(escapeCsvField("\r=cmd|'/bin/sh'!A1"));
    expect(result).toBe("'\r=cmd|'/bin/sh'!A1");
  });

  it("neutralizes a marker after a leading newline", () => {
    const result = unwrapCsvQuoting(escapeCsvField("\n=cmd|'/bin/sh'!A1"));
    expect(result).toBe("'\n=cmd|'/bin/sh'!A1");
  });

  it("neutralizes a marker after mixed leading whitespace (tab, spaces, and CRLF together)", () => {
    const result = unwrapCsvQuoting(escapeCsvField("\t  \r\n+cmd|'/bin/sh'!A1"));
    expect(result).toBe("'\t  \r\n+cmd|'/bin/sh'!A1");
  });

  for (const marker of ["=", "+", "-", "@"]) {
    it(`catches "${marker}" specifically after leading spaces`, () => {
      const result = unwrapCsvQuoting(escapeCsvField(`  ${marker}cmd`));
      expect(result).toBe(`'  ${marker}cmd`);
    });
  }

  it("does not falsely flag leading whitespace around an otherwise-safe value", () => {
    expect(escapeCsvField("   Henry")).toBe("   Henry");
  });

  it("applies correct CSV quoting alongside the neutralizing prefix when the value also contains a comma", () => {
    const result = escapeCsvField("  =SUM(A1,A2)");
    expect(result).toBe(`"'  =SUM(A1,A2)"`);
  });
});

describe("toCsvRow / buildCsv", () => {
  it("joins fields with commas and ends with CRLF", () => {
    expect(toCsvRow(["a", "b", "c"])).toBe("a,b,c\r\n");
  });

  it("renders null/undefined as empty fields", () => {
    expect(toCsvRow(["a", null, undefined, 5])).toBe("a,,,5\r\n");
  });

  it("builds a full CSV with a header row", () => {
    const csv = buildCsv(["Name", "Amount"], [["Henry", "$5.00"], ["Anonymous", "$10.00"]]);
    expect(csv).toBe("Name,Amount\r\nHenry,$5.00\r\nAnonymous,$10.00\r\n");
  });
});
