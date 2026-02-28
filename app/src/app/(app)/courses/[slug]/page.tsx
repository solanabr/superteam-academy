import type { Metadata } from "next";
import { getAllCourses, getCourseBySlug } from "@/lib/data-service";
import CourseDetailClient from "@/components/course/course-detail-client";

/** Revalidate course detail pages every hour via ISR */
export const revalidate = 3600;

/**
 * Pre-generate static pages for all known course slugs at build time.
 * Unknown slugs are still handled at runtime (dynamicParams defaults to true).
 */
export async function generateStaticParams() {
  const courses = await getAllCourses();
  return courses.map((course) => ({ slug: course.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const course = await getCourseBySlug(slug);

  if (!course) {
    return { title: "Course Not Found" };
  }

  return {
    title: course.title,
    description: course.description,
    openGraph: {
      title: `${course.title} | Superteam Academy`,
      description: course.description,
    },
  };
}

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <CourseDetailClient slug={slug} />;
}
