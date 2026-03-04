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

  const lessonIdx = course.lessons.findIndex((l) => l.slug === id);
  if (lessonIdx === -1) notFound();

  const lesson = course.lessons[lessonIdx];
  const prev = course.lessons[lessonIdx - 1] ?? null;
  const next = course.lessons[lessonIdx + 1] ?? null;

  return (
    <Shell>
      <div className="grid gap-8 lg:grid-cols-[1fr_280px]">
        {/* Main content */}
        <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <Link href="/courses" className="hover:underline">
              Courses
            </Link>
            <span>/</span>
            <Link href={`/courses/${slug}`} className="hover:underline">
              {course.title}
            </Link>
            <span>/</span>
            <span className="text-zinc-700">{lesson.title}</span>
          </div>

          <h1 className="mt-4 text-2xl font-semibold">{lesson.title}</h1>
          <div className="mt-1 text-xs text-zinc-500">
            ~{lesson.minutes} min • Lesson {lessonIdx + 1} of{" "}
            {course.lessons.length}
          </div>

          {/* Placeholder lesson content */}
          <div className="mt-8 space-y-4 text-sm text-zinc-700 leading-relaxed">
            <p>
              This is a placeholder for the lesson content. In production, this
              will be rendered from a CMS (Sanity / MDX) with rich text,
              embedded code blocks, and interactive challenges.
            </p>
            <div className="rounded-xl bg-zinc-900 p-5 font-mono text-xs text-zinc-100">
              <div className="mb-2 text-zinc-500">// code editor placeholder</div>
              <div>{"const connection = new Connection(clusterApiUrl('devnet'));"}</div>
              <div>{"const balance = await connection.getBalance(publicKey);"}</div>
              <div>{"console.log(`Balance: ${balance / LAMPORTS_PER_SOL} SOL`);"}</div>
            </div>
            <p>
              The code editor will use Monaco/CodeMirror with a run + feedback
              loop for hands-on challenges.
            </p>
          </div>

          {/* Nav */}
          <div className="mt-10 flex items-center justify-between border-t border-zinc-200 pt-6">
            {prev ? (
              <Link
                href={`/courses/${slug}/lessons/${prev.slug}`}
                className="rounded-xl border border-zinc-200 px-4 py-2 text-sm hover:border-zinc-300"
              >
                ← {prev.title}
              </Link>
            ) : (
              <span />
            )}
            {next ? (
              <Link
                href={`/courses/${slug}/lessons/${next.slug}`}
                className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
              >
                {next.title} →
              </Link>
            ) : (
              <Link
                href={`/courses/${slug}`}
                className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
              >
                Complete ✓
              </Link>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <aside className="hidden lg:block">
          <div className="sticky top-8 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold">{course.title}</h3>
            <div className="mt-4 space-y-1">
              {course.lessons.map((l, i) => (
                <Link
                  key={l.slug}
                  href={`/courses/${slug}/lessons/${l.slug}`}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs transition ${
                    l.slug === id
                      ? "bg-zinc-100 font-medium text-zinc-900"
                      : "text-zinc-600 hover:bg-zinc-50"
                  }`}
                >
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-200 text-[10px]">
                    {i + 1}
                  </span>
                  {l.title}
                </Link>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </Shell>
  );
}
