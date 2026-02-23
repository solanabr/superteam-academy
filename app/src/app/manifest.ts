import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Superteam Academy",
    short_name: "Academy",
    description:
      "The gamified learning platform for Solana developers. Earn XP, collect on-chain credentials, and level up your skills.",
    start_url: "/",
    display: "standalone",
    background_color: "#0C0A09",
    theme_color: "#00FFA3",
    orientation: "portrait-primary",
    categories: ["education", "developer-tools"],
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
