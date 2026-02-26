import { notFound } from "next/navigation";
import { getCourseBySlug, getLessonById } from "@/sanity/lib/queries";
import { LessonViewClient } from "@/components/lessons/LessonViewClient";
import { EnrollmentGate } from "@/components/courses/EnrollmentGate";

export default async function LessonPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  const course = await getCourseBySlug(slug);
  const lesson = await getLessonById(id);
  if (!course || !lesson) notFound();

  return (
    <EnrollmentGate courseId={course._id} courseSlug={course.slug}>
      <LessonViewClient course={course} lesson={lesson} />
    </EnrollmentGate>
  );
}
