import Link from "next/link";
import { getCourse } from "@/lib/courses";
import { notFound } from "next/navigation";

export default async function CoursePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const course = getCourse(slug);
  if (!course) notFound();

  return (
    <div className="min-h-screen bg-zinc-50 px-6 py-12 text-zinc-900">
      <div className="mx-auto w-full max-w-3xl">
        <Link className="text-sm underline" href="/courses">
          ← Back to courses
        </Link>

        <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold">{course.title}</h1>
              <p className="mt-2 text-sm text-zinc-600">{course.description}</p>
            </div>
            <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs">
              {course.level}
            </span>
          </div>

          <div className="mt-6">
            <h2 className="text-lg font-semibold">Lessons</h2>
            <ol className="mt-3 space-y-2">
              {course.lessons.map((l, i) => (
                <li
                  key={l.slug}
                  className="flex items-center justify-between rounded-xl border border-zinc-200 px-4 py-3"
                >
                  <div className="text-sm">
                    <span className="mr-2 text-zinc-500">{i + 1}.</span>
                    {l.title}
                  </div>
                  <div className="text-xs text-zinc-500">{l.minutes} min</div>
                </li>
              ))}
            </ol>
          </div>

          <div className="mt-8 flex gap-3">
            <Link
              className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
              href="/login"
            >
              Enroll (stub)
            </Link>
            <Link
              className="rounded-xl border border-zinc-200 px-4 py-2 text-sm"
              href="/me"
            >
              View profile
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
