import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import manifest from "@/app/manifest";

describe("manifest", () => {
  const result = manifest();

  it("declares the app name and short_name", () => {
    expect(result.name).toBe("ONE MILLION");
    expect(result.short_name).toBe("ONE MILLION");
  });

  it("starts and scopes at the site root", () => {
    expect(result.start_url).toBe("/");
    expect(result.scope).toBe("/");
  });

  it("uses standalone display", () => {
    expect(result.display).toBe("standalone");
  });

  it("uses a black background and theme color, consistent with the site", () => {
    expect(result.background_color).toBe("#000000");
    expect(result.theme_color).toBe("#000000");
  });

  it("declares a 192x192 and a 512x512 PNG icon", () => {
    const sizes = result.icons?.map((icon) => icon.sizes);
    expect(sizes).toContain("192x192");
    expect(sizes).toContain("512x512");
    for (const icon of result.icons ?? []) {
      expect(icon.type).toBe("image/png");
      expect(icon.src.startsWith("/icons/")).toBe(true);
    }
  });

  it("declares both any and maskable purposes for each size", () => {
    const purposesFor = (size: string) =>
      (result.icons ?? []).filter((icon) => icon.sizes === size).map((icon) => icon.purpose);
    expect(purposesFor("192x192")).toEqual(expect.arrayContaining(["any", "maskable"]));
    expect(purposesFor("512x512")).toEqual(expect.arrayContaining(["any", "maskable"]));
  });

  it("every declared icon src exists on disk as a real PNG file with the declared dimensions", () => {
    for (const icon of result.icons ?? []) {
      const filePath = path.resolve(process.cwd(), "public", icon.src!.replace(/^\//, ""));
      expect(existsSync(filePath)).toBe(true);

      const buffer = readFileSync(filePath);
      // PNG signature
      expect(buffer.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");

      // IHDR chunk: width and height are the first 8 bytes after the
      // 8-byte signature + 4-byte length + 4-byte "IHDR" type (bytes 16-24).
      const width = buffer.readUInt32BE(16);
      const height = buffer.readUInt32BE(20);
      const [declaredWidth, declaredHeight] = icon.sizes!.split("x").map(Number);
      expect(width).toBe(declaredWidth);
      expect(height).toBe(declaredHeight);
    }
  });
});
