import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Superteam Academy",
    short_name: "Academy",
    description: "Learn Solana. Earn Credentials. Build the Future.",
    start_url: "/",
    display: "standalone",
    background_color: "#1b231d",
    theme_color: "#ffd23f",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
