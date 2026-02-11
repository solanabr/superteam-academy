import { notFound } from "next/navigation";
import { CourseDetailClient } from "./course-detail-client";
import { getCourseBySlug } from "@/lib/sanity/queries";

interface CourseDetailPageProps {
  params: Promise<{ slug: string }>;
}

export default async function CourseDetailPage({
  params,
}: CourseDetailPageProps) {
  const { slug } = await params;
  const course = await getCourseBySlug(slug);
  if (!course) notFound();
  return <CourseDetailClient course={course} />;
}
