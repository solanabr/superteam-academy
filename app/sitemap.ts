import type { MetadataRoute } from "next";
import { getCoursesFromCms } from "@/lib/cms/sanity-client";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const courses = await getCoursesFromCms();

  const staticRoutes: MetadataRoute.Sitemap = [
    "",
    "/courses",
    "/dashboard",
    "/leaderboard",
    "/settings",
    "/admin/courses"
  ].map((path) => ({
    url: `${baseUrl}${path}`,
    changeFrequency: "weekly",
    priority: path === "" ? 1 : 0.7
  }));

  const dynamicRoutes: MetadataRoute.Sitemap = courses.flatMap((course) => {
    const lessonEntries = course.modules.flatMap((module) =>
      module.lessons.map((lesson, lessonIndex) => ({
        url: `${baseUrl}/courses/${course.slug}/lessons/${lessonIndex + 1}`,
        changeFrequency: "weekly" as const,
        priority: 0.6
      }))
    );

    return [
      {
        url: `${baseUrl}/courses/${course.slug}`,
        changeFrequency: "weekly" as const,
        priority: 0.8
      },
      ...lessonEntries
    ];
  });

  return [...staticRoutes, ...dynamicRoutes];
}
