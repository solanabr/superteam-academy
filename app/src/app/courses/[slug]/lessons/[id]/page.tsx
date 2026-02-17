import Link from "next/link";
import { notFound } from "next/navigation";

import { Shell } from "@/components/Shell";
import { getCourse } from "@/lib/courses";

export default async function LessonPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;

  const course = getCourse(slug);
  if (!course) notFound();

  const index = Number(id) - 1; // URLs are 1-indexed
  if (!Number.isFinite(index) || index < 0 || index >= course.lessons.length) {
    notFound();
  }

  const lesson = course.lessons[index];
  const prevId = index > 0 ? String(index) : null;
  const nextId = index < course.lessons.length - 1 ? String(index + 2) : null;

  return (
    <Shell
      title={lesson.title}
      subtitle={`${course.title} • Lesson ${index + 1} of ${course.lessons.length} • ${lesson.minutes} min`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link className="text-sm underline" href={`/courses/${course.slug}`}>
          ← Back to course
        </Link>

        <div className="flex items-center gap-2">
          {prevId ? (
            <Link
              className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm hover:border-zinc-300"
              href={`/courses/${course.slug}/lessons/${prevId}`}
            >
              ← Prev
            </Link>
          ) : null}
          {nextId ? (
            <Link
              className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
              href={`/courses/${course.slug}/lessons/${nextId}`}
            >
              Next →
            </Link>
          ) : (
            <Link
              className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
              href="/dashboard"
            >
              Finish → Dashboard
            </Link>
          )}
        </div>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-3">
        <section className="md:col-span-2">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="prose prose-zinc max-w-none">
              <p>
                This is placeholder lesson content. Next milestones will wire real
                markdown/MDX from a CMS and add interactive challenges (editor +
                runner + feedback loop).
              </p>
              <h3>What you’ll do</h3>
              <ul>
                <li>Read the concept</li>
                <li>Try the mini challenge (coming soon)</li>
                <li>Earn XP (stub now, on-chain later)</li>
              </ul>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold">Challenge (stub)</div>
            <div className="mt-2 text-sm text-zinc-600">
              Monaco/CodeMirror integration will live here.
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <button className="rounded-xl border border-zinc-200 px-4 py-2 text-sm">
                Run
              </button>
              <button className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white">
                Submit
              </button>
            </div>
          </div>
        </section>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="text-xs text-zinc-500">Progress (stub)</div>
            <div className="mt-2">
              <div className="text-sm font-medium">
                {index + 1}/{course.lessons.length} lessons
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-zinc-100">
                <div
                  className="h-full bg-zinc-900"
                  style={{ width: `${((index + 1) / course.lessons.length) * 100}%` }}
                />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="text-xs text-zinc-500">Lesson XP (stub)</div>
            <div className="mt-1 text-2xl font-semibold">+{100 + index * 25}</div>
            <div className="mt-3 text-xs text-zinc-500">
              We’ll eventually read your XP token balance on Devnet.
            </div>
          </div>
        </aside>
      </div>
    </Shell>
  );
}
