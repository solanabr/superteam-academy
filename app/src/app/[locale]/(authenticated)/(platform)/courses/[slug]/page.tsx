import { notFound } from "next/navigation";
import { Link } from "@/i18n/routing";
import Image from "next/image";
import { getCourseBySlug } from "@/sanity/lib/queries";
import { urlFor } from "@/sanity/lib/image";
import { EnrollButton } from "@/components/courses/EnrollButton";
import { CourseEnrollmentBlock } from "@/components/courses/CourseEnrollmentBlock";
import { CourseCompletion } from "@/components/courses/CourseCompletion";
import { getTranslations } from "next-intl/server";
import { ModuleList } from "@/components/courses/ModuleList";
import { ReviewsSection } from "@/components/courses/ReviewsSection";

export const revalidate = 60; // ISR cache for 1 minute (proactive revalidation handle most updates)

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>;
}) {
  const { slug, locale } = await params;
  const t = await getTranslations("courses");
  const course = await getCourseBySlug(slug, locale);
  if (!course) notFound();

  const lessonCount =
    course.modules?.reduce((acc, m) => acc + (m.lessons?.length ?? 0), 0) ?? 0;

  return (
    <main className="min-h-screen bg-void pt-4 pb-12">
      <div className="mx-auto max-w-7xl px-4">
        <nav className="flex items-center gap-2 text-xs font-mono text-text-muted mb-6 uppercase tracking-widest">
          <Link href="/courses" className="hover:text-solana transition-colors">Courses</Link>
          <span className="text-white/20">/</span>
          <span className="text-solana truncate max-w-[200px] md:max-w-none">{course.title}</span>
        </nav>
        <div className="glass-panel flex flex-col gap-6 overflow-hidden rounded-lg border p-6 md:flex-row md:gap-8 border-white/5">
          <div className="shrink-0 md:w-72">
            {course.image?.asset?._ref ? (
              <Image
                src={urlFor(course.image).width(400).height(225).url()}
                alt=""
                width={400}
                height={225}
                className="rounded-lg object-cover"
              />
            ) : (
              <div className="from-solana/10 to-[#FFD23F]/10 flex aspect-video w-full items-center justify-center rounded-lg bg-gradient-to-br">
                <span className="text-text-secondary text-5xl opacity-50">⌘</span>
              </div>
            )}
          </div>
          <div className="flex flex-1 flex-col gap-4">
            {course.track && (
              <span className="text-solana text-xs font-medium uppercase tracking-wider">
                {t(`filters.${course.track.toLowerCase()}` as any)}
              </span>
            )}
            <h1 className="font-display text-text-primary text-2xl font-bold md:text-3xl">
              {course.title}
            </h1>
            {course.description && (
              <p className="text-text-secondary leading-relaxed">{course.description}</p>
            )}
            <div className="text-text-secondary flex flex-wrap gap-4 text-sm">
              {course.instructor && <span>{t("instructor")}: {course.instructor}</span>}
              {course.duration && <span>{course.duration}</span>}
              {course.difficulty && <span className="capitalize">{t(course.difficulty.toLowerCase() as any)}</span>}
              {lessonCount > 0 && <span>{t("lessons_count", { count: lessonCount })}</span>}
            </div>
            <div className="mt-2">
              <CourseEnrollmentBlock courseId={course._id} courseTitle={course.title} />
              <CourseCompletion courseId={course._id} totalLessons={lessonCount} />
            </div>
          </div>
        </div>

        {course.modules && course.modules.length > 0 && (
          <section className="mt-10">
            <h2 className="font-display text-text-primary mb-4 text-xl font-semibold">
              {t("course_content")}
            </h2>
            <ModuleList
              courseId={course._id}
              courseSlug={course.slug}
              modules={course.modules as any}
            />
          </section>
        )}

        {(!course.modules || course.modules.length === 0) && (
          <p className="text-text-secondary mt-8 text-sm">
            {t("no_modules")}
          </p>
        )}

        <ReviewsSection />
      </div>
    </main>
  );
}
