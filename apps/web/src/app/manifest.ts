import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Superteam Academy",
    short_name: "Academy",
    description:
      "The definitive learning platform for Solana developers. Interactive courses, on-chain credentials, and a community of builders.",
    start_url: "/",
    display: "standalone",
    // Brand navy — the dark theme's page colour, which is what the app boots into.
    background_color: "#0E1117",
    theme_color: "#0E1117",
    icons: [
      { src: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { src: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      {
        src: "/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
      // Purpose-built safe-zone variant from the brand pack — the owner's
      // android-chrome-512 is full-bleed and would get clipped when masked.
      {
        src: "/maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
