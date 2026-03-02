import type { MetadataRoute } from "next";
import { locales } from "@/i18n/config";
import { courses } from "@/lib/services/courses";

const BASE_URL = "https://superteam-academy-gules.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages = [
    "",
    "/courses",
    "/dashboard",
    "/leaderboard",
    "/profile",
    "/settings",
    "/certificates",
  ];

  const entries: MetadataRoute.Sitemap = [];

  for (const locale of locales) {
    for (const page of staticPages) {
      entries.push({
        url: `${BASE_URL}/${locale}${page}`,
        lastModified: new Date(),
        changeFrequency: page === "" ? "weekly" : "daily",
        priority: page === "" ? 1.0 : 0.8,
      });
    }

    for (const course of courses) {
      entries.push({
        url: `${BASE_URL}/${locale}/courses/${course.slug}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }
  }

  return entries;
}
