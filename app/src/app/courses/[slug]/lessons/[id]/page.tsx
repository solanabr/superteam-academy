import Link from "next/link";
import { Shell } from "@/components/Shell";
import { getCourse } from "@/lib/courses";
import { notFound } from "next/navigation";

export default async function LessonPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  const course = getCourse(slug);
  if (!course) notFound();

  const idx = Number(id) - 1;
  const lesson = course.lessons[idx];
  if (!lesson) notFound();

  const prev = idx > 0 ? idx : null;
  const next = idx + 1 < course.lessons.length ? idx + 2 : null;

  return (
    <Shell title={lesson.title} subtitle={course.title}>
      <div className="mb-6 flex items-center justify-between gap-4">
        <Link className="text-sm underline" href={`/courses/${course.slug}`}>
          ← Back to course
        </Link>
        <div className="text-xs text-zinc-500">
          Lesson {idx + 1} / {course.lessons.length}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold">Lesson content (placeholder)</h2>
          <p className="mt-3 text-sm text-zinc-600">
            This will be rendered from the CMS (markdown) and localized. For now
            we keep it simple and focus on layout, navigation, and services.
          </p>

          <div className="mt-6 rounded-xl bg-zinc-50 p-4 text-sm">
            <div className="font-mono text-xs text-zinc-500">Objective</div>
            <div className="mt-1">Complete the exercise and mark the lesson done.</div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            {prev !== null ? (
              <Link
                className="rounded-xl border border-zinc-200 px-4 py-2 text-sm"
                href={`/courses/${course.slug}/lessons/${prev}`}
              >
                ← Prev
              </Link>
            ) : null}
            {next !== null ? (
              <Link
                className="rounded-xl border border-zinc-200 px-4 py-2 text-sm"
                href={`/courses/${course.slug}/lessons/${next}`}
              >
                Next →
              </Link>
            ) : null}
            <button className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white">
              Mark complete (stub)
            </button>
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold">Code editor (next)</h2>
          <div className="mt-3 rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-4 text-sm text-zinc-600">
            Monaco/CodeMirror will live here, with run + tests + pass/fail.
          </div>
          <div className="mt-4 rounded-xl bg-black p-4 font-mono text-xs text-zinc-200">
            $ echo {"placeholder"}
          </div>
        </section>
      </div>
    </Shell>
  );
}
