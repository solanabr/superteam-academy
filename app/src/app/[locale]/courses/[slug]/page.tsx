import { notFound } from "next/navigation";
import { getCourseBySlug } from "@/lib/courses";
import CourseView from "./course-view";

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const course = await getCourseBySlug(slug);

  if (!course) notFound();

  return <CourseView course={course} slug={slug} />;
}
