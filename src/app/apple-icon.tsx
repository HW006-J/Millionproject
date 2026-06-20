import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/**
 * Generated Apple touch icon — complementary to, not a replacement for, the
 * static manifest install icons in public/icons/ (the manifest never points
 * here). Same placeholder "1M" mark, kept in sync by hand until real
 * artwork replaces both.
 */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#000000",
          color: "#ffffff",
          fontSize: 84,
          fontWeight: 700,
          fontFamily: "sans-serif",
        }}
      >
        1M
      </div>
    ),
    { ...size },
  );
}
