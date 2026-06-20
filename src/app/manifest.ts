import type { MetadataRoute } from "next";

/**
 * Icons reference static files under public/icons/ (not a generated
 * metadata route) so the manifest always has a real, stable install icon
 * URL regardless of how /icon or /apple-icon resolve. Both PNGs use a
 * simple black-and-white placeholder design with generous padding around
 * the mark, which is why "maskable" is also accurate here — see
 * public/icons/icon-512.png / icon-192.png.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ONE MILLION",
    short_name: "ONE MILLION",
    description: "No cause. No reward. No explanation. Just one ridiculous goal.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#000000",
    theme_color: "#000000",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
