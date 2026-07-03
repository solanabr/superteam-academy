import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { authorizeTeacher } from "@/lib/teacher/authorize";
import { getTeacherCourseEditable } from "@/lib/sanity/teacher-mutations";
import { CourseForm } from "@/components/teacher/course-form";

export const dynamic = "force-dynamic";

export default async function EditCoursePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;

  const auth = await authorizeTeacher();
  if (!auth.ok) redirect(`/${locale}`);

  const course = await getTeacherCourseEditable(id);
  if (!course) notFound();

  // Ownership: teachers may only edit their own courses; admins may edit any.
  if (auth.caller.role !== "admin" && course.author !== auth.caller.userId) {
    redirect(`/${locale}/teach/courses`);
  }

  const t = await getTranslations("teacher.form");

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Link
        href={`/${locale}/teach/courses`}
        className="text-sm text-text-3 underline hover:no-underline"
      >
        &larr; {t("back")}
      </Link>
      <h1 className="mb-6 mt-3 font-display text-2xl font-bold text-text">
        {t("editHeading")}
      </h1>
      <CourseForm mode="edit" courseId={course._id} initial={course} />
    </div>
  );
}
