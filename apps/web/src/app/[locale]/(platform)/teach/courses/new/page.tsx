import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { CourseForm } from "@/components/teacher/course-form";
import { getManagedCourseTags } from "@/lib/sanity/queries";

export default async function NewCoursePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("teacher.form");
  const availableTags = (await getManagedCourseTags()).map((tag) => tag.name);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Link
        href={`/${locale}/teach/courses`}
        className="text-sm text-text-3 underline hover:no-underline"
      >
        &larr; {t("back")}
      </Link>
      <h1 className="mb-6 mt-3 font-display text-2xl font-bold text-text">
        {t("createHeading")}
      </h1>
      <CourseForm mode="create" availableTags={availableTags} />
    </div>
  );
}
