import { describe, expect, it, vi } from "vitest";

// next/font/google's loaders are compiler-transformed at build time and
// aren't real callable functions outside Next's own bundler — stub them so
// layout.tsx can be imported directly in a plain Vitest run.
vi.mock("next/font/google", () => ({
  Geist: () => ({ variable: "--font-geist-sans" }),
  Geist_Mono: () => ({ variable: "--font-geist-mono" }),
}));

const { viewport } = await import("@/app/layout");

describe("root viewport export", () => {
  it("declares a theme color consistent with the site's black background", () => {
    expect(viewport.themeColor).toBe("#000000");
  });
});
