import Link from "next/link";
import { Shell } from "@/components/Shell";
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
    <Shell title={course.title} subtitle={course.description}>
      <div className="flex items-center justify-between">
        <Link className="text-sm underline" href="/courses">
          ← Back to courses
        </Link>
        <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs">
          {course.level}
        </span>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-3">
        <section className="md:col-span-2">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Lessons</h2>
            <ol className="mt-4 space-y-2">
              {course.lessons.map((l, i) => (
                <li key={l.slug}>
                  <Link
                    href={`/courses/${course.slug}/lessons/${i + 1}`}
                    className="flex items-center justify-between rounded-xl border border-zinc-200 px-4 py-3 hover:border-zinc-300"
                  >
                    <div className="text-sm">
                      <span className="mr-2 text-zinc-500">{i + 1}.</span>
                      {l.title}
                    </div>
                    <div className="text-xs text-zinc-500">{l.minutes} min</div>
                  </Link>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="text-xs text-zinc-500">Course XP (stub)</div>
            <div className="mt-1 text-2xl font-semibold">+750</div>
            <div className="mt-3 text-xs text-zinc-500">
              Real rewards will be wired to the on-chain program; until then we
              use a typed service interface.
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="text-sm font-semibold">Enrollment</div>
            <div className="mt-3 flex gap-3">
              <Link
                className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
                href="/login"
              >
                Sign in
              </Link>
              <Link
                className="rounded-xl border border-zinc-200 px-4 py-2 text-sm"
                href="/me"
              >
                Profile
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </Shell>
  );
}
