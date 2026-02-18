import { notFound } from "next/navigation";
import { Link } from "@/i18n/routing";
import Image from "next/image";
import { getCourseBySlug } from "@/sanity/lib/queries";
import { urlFor } from "@/sanity/lib/image";
import { EnrollButton } from "@/components/courses/EnrollButton";
import { CourseEnrollmentBlock } from "@/components/courses/CourseEnrollmentBlock";
import { CourseCompletion } from "@/components/courses/CourseCompletion";

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const course = await getCourseBySlug(slug);
  if (!course) notFound();

  const lessonCount =
    course.modules?.reduce((acc, m) => acc + (m.lessons?.length ?? 0), 0) ?? 0;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="glass-panel flex flex-col gap-6 overflow-hidden rounded-lg border p-6 md:flex-row md:gap-8">
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
            <div className="from-solana/10 to-rust/10 flex aspect-video w-full items-center justify-center rounded-lg bg-gradient-to-br">
              <span className="text-text-secondary text-5xl opacity-50">⌘</span>
            </div>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-4">
          {course.track && (
            <span className="text-solana text-xs font-medium uppercase tracking-wider">
              {course.track}
            </span>
          )}
          <h1 className="font-display text-text-primary text-2xl font-bold md:text-3xl">
            {course.title}
          </h1>
          {course.description && (
            <p className="text-text-secondary leading-relaxed">{course.description}</p>
          )}
          <div className="text-text-secondary flex flex-wrap gap-4 text-sm">
            {course.instructor && <span>Instructor: {course.instructor}</span>}
            {course.duration && <span>{course.duration}</span>}
            {course.difficulty && <span className="capitalize">{course.difficulty}</span>}
            {lessonCount > 0 && <span>{lessonCount} lessons</span>}
          </div>
          <div className="mt-2">
            <CourseEnrollmentBlock courseId={course.slug} courseTitle={course.title} />
            <CourseCompletion courseId={course.slug} totalLessons={lessonCount} />
          </div>
        </div>
      </div>

      {course.modules && course.modules.length > 0 && (
        <section className="mt-10">
          <h2 className="font-display text-text-primary mb-4 text-xl font-semibold">
            Course content
          </h2>
          <div className="flex flex-col gap-4">
            {course.modules
              .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
              .map((mod, modIndex) => (
                <div
                  key={mod._id}
                  className="glass-panel rounded-lg border p-4"
                >
                  <h3 className="font-display text-text-primary font-medium">
                    Module {modIndex + 1}: {mod.title}
                  </h3>
                  <ul className="mt-3 flex flex-col gap-2">
                    {(mod.lessons ?? [])
                      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
                      .map((lesson, lessonIndex) => (
                        <li key={lesson._id}>
                          <Link
                            href={`/courses/${course.slug}/lessons/${lesson._id}`}
                            className="text-text-secondary hover:text-solana flex items-center gap-2 text-sm transition-colors"
                          >
                            <span className="text-text-secondary shrink-0">
                              {lesson.lessonType === "challenge" ? "⌘" : "◦"}
                            </span>
                            {lesson.title}
                          </Link>
                        </li>
                      ))}
                  </ul>
                </div>
              ))}
          </div>
        </section>
      )}

      {(!course.modules || course.modules.length === 0) && (
        <p className="text-text-secondary mt-8 text-sm">
          No modules yet. Add modules and lessons in Sanity Studio.
        </p>
      )}
    </div>
  );
}
