import Link from "next/link";
import { notFound } from "next/navigation";
import { Shell } from "@/components/Shell";
import { getCourse } from "@/lib/courses";

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const course = await getCourse(slug);
  if (!course) notFound();

  return (
    <Shell>
      <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <Link
              href="/courses"
              className="text-xs text-zinc-500 hover:underline"
            >
              ← All courses
            </Link>
            <h1 className="mt-2 text-3xl font-semibold">{course.title}</h1>
            <p className="mt-2 text-sm text-zinc-600">{course.description}</p>
          </div>
          <span className="shrink-0 rounded-full bg-zinc-100 px-3 py-1 text-xs">
            {course.level}
          </span>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {course.tags.map((t) => (
            <span
              key={t}
              className="rounded-full border border-zinc-200 px-2.5 py-1 text-xs text-zinc-700"
            >
              {t}
            </span>
          ))}
        </div>

        <div className="mt-8">
          <h2 className="text-lg font-semibold">Lessons</h2>
          <div className="mt-4 space-y-3">
            {course.lessons.map((lesson, i) => (
              <Link
                key={lesson.slug}
                href={`/courses/${course.slug}/lessons/${lesson.slug}`}
                className="flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50 px-5 py-4 transition hover:border-zinc-300"
              >
                <div className="flex items-center gap-4">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-200 text-xs font-medium">
                    {i + 1}
                  </span>
                  <span className="text-sm font-medium">{lesson.title}</span>
                </div>
                <span className="text-xs text-zinc-500">
                  {lesson.minutes} min
                </span>
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-8 flex gap-3">
          <button className="rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white">
            Start course
          </button>
          <Link
            href="/dashboard"
            className="rounded-xl border border-zinc-200 px-5 py-2.5 text-sm"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </Shell>
  );
}
