import Link from "next/link";
import { Shell } from "@/components/Shell";
import { COURSES } from "@/lib/courses";

export default function CoursesPage() {
  return (
    <Shell
      title="Courses"
      subtitle="A production catalog will be powered by a CMS; this is a typed mock so we can build UX first."
    >
      <div className="grid gap-4 md:grid-cols-2">
        {COURSES.map((c) => (
          <Link
            key={c.slug}
            href={`/courses/${c.slug}`}
            className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-zinc-300"
          >
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-lg font-semibold">{c.title}</h2>
              <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs">
                {c.level}
              </span>
            </div>
            <p className="mt-2 text-sm text-zinc-600">{c.description}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {c.tags.map((t) => (
                <span
                  key={t}
                  className="rounded-full border border-zinc-200 px-2.5 py-1 text-xs text-zinc-700"
                >
                  {t}
                </span>
              ))}
            </div>
            <div className="mt-4 text-xs text-zinc-500">
              {c.lessons.length} lessons
            </div>
          </Link>
        ))}
      </div>
    </Shell>
  );
}
