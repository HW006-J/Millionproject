import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

/**
 * Generated favicon — complementary to, not a replacement for, the static
 * manifest install icons in public/icons/ (the manifest never points here).
 * Same placeholder "1M" mark, kept in sync by hand until real artwork
 * replaces both.
 */
export default function Icon() {
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
          fontSize: 18,
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
