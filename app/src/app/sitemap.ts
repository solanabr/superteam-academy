import type { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://superteam-academy.vercel.app";

  // Static pages — no locale prefix (localePrefix: "never")
  const staticPages = ["/", "/courses", "/dashboard", "/leaderboard", "/community", "/settings", "/profile"];

  const entries: MetadataRoute.Sitemap = [];

  for (const page of staticPages) {
    entries.push({
      url: `${baseUrl}${page}`,
      lastModified: new Date(),
      changeFrequency: page === "/" ? "daily" : "weekly",
      priority: page === "/" ? 1 : 0.8,
    });
  }

  // Dynamic: courses from Sanity
  // Try to fetch course slugs if Sanity is configured
  try {
    const { getAllCourses } = await import("@/lib/sanity/queries");
    const courses = await getAllCourses();
    for (const course of courses) {
      entries.push({
        url: `${baseUrl}/courses/${course.slug}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.9,
      });
    }
  } catch {
    // Sanity not configured, skip dynamic entries
  }

  return entries;
}
