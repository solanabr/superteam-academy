import type { MetadataRoute } from "next";

const BASE = "https://superteam-academy.vercel.app";
const LOCALES = ["en", "pt-BR", "es"];
const PAGES = [
  "",
  "/leaderboard",
  "/profile",
  "/settings",
  "/my-learning",
  "/dashboard",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  for (const locale of LOCALES) {
    for (const page of PAGES) {
      entries.push({
        url: `${BASE}/${locale}${page}`,
        lastModified: new Date(),
        changeFrequency: page === "" ? "daily" : "weekly",
        priority: page === "" ? 1.0 : 0.7,
      });
    }
  }

  return entries;
}
