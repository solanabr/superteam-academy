import { MetadataRoute } from "next";
import { getAllCourses } from "@/lib/sanity/queries";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://superteam-lms.vercel.app";
  const locales = ["en", "pt-BR", "es"];

  const publicRoutes = ["", "/courses", "/leaderboard"];
  const staticEntries = locales.flatMap((locale) =>
    publicRoutes.map((route) => ({
      url: `${baseUrl}/${locale}${route}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: route === "" ? 1 : 0.8,
    }))
  );

  // Dynamic course URLs
  let courseUrls: MetadataRoute.Sitemap = [];
  try {
    const courses = await getAllCourses();
    courseUrls = locales.flatMap((locale) =>
      (courses ?? []).map((course) => ({
        url: `${baseUrl}/${locale}/courses/${course.slug}`,
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.7,
      }))
    );
  } catch {
    // Sanity unavailable — skip dynamic URLs
  }

  return [...staticEntries, ...courseUrls];
}
