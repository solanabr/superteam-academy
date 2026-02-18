import { Link } from "@/i18n/routing";
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
    <div className="mx-auto max-w-6xl px-4 py-8">
      <nav className="text-text-secondary mb-6 flex items-center gap-2 text-sm">
        <Link href="/courses" className="hover:text-solana transition-colors">Curriculum</Link>
        <span>/</span>
        <Link href={`/courses/${slug}`} className="hover:text-solana transition-colors">
          {course.title}
        </Link>
        <span>/</span>
        <span className="text-text-primary">{lesson.title}</span>
      </nav>

      {/* EnrollmentGate: blocks unenrolled users from seeing lesson content */}
      <EnrollmentGate courseId={course._id} courseSlug={course.slug}>
        <LessonViewClient course={course} lesson={lesson} />
      </EnrollmentGate>
    </div>
  );
}
