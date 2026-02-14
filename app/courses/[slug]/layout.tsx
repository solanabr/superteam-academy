import type { ReactNode } from "react";
import type { Metadata } from "next";
import { getCourseBySlugFromCms } from "@/lib/cms/sanity-client";
import { createPageMetadata } from "@/lib/seo/metadata";

type LayoutProps = {
  children: ReactNode;
  params: { slug: string };
};

export async function generateMetadata({ params }: LayoutProps): Promise<Metadata> {
  const course = await getCourseBySlugFromCms(params.slug);
  if (!course) {
    return createPageMetadata("Course Not Found | Superteam Academy", "Course not found.", `/courses/${params.slug}`);
  }

  return createPageMetadata(
    `${course.title} | Superteam Academy`,
    course.description,
    `/courses/${course.slug}`
  );
}

export default function CourseSlugLayout({ children }: LayoutProps): JSX.Element {
  return <>{children}</>;
}
