import Link from "next/link";
import { notFound } from "next/navigation";
import { getCourseBySlug, getLessonById } from "@/sanity/lib/queries";

type PortableTextSpan = { _type?: string; text?: string };
type PortableTextBlock = { _type?: string; style?: string; children?: PortableTextSpan[] };

function portableTextToParagraphs(content: unknown): string[] {
  if (!Array.isArray(content)) return [];
  const blocks = content as PortableTextBlock[];
  return blocks
    .filter((b) => b && b._type === "block")
    .map((b) =>
      (Array.isArray(b.children) ? b.children : [])
        .map((c) => c?.text ?? "")
        .join("")
        .trim()
    )
    .filter(Boolean);
}

export default async function LessonPlaceholderPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  const course = await getCourseBySlug(slug);
  const lesson = await getLessonById(id);
  if (!course || !lesson) notFound();

  const paragraphs = portableTextToParagraphs(lesson.content);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <nav className="text-text-secondary mb-6 flex items-center gap-2 text-sm">
        <Link href="/courses" className="hover:text-solana transition-colors">Curriculum</Link>
        <span>/</span>
        <Link href={`/courses/${slug}`} className="hover:text-solana transition-colors">
          {course.title}
        </Link>
        <span>/</span>
        <span className="text-text-primary">{lesson.title}</span>
      </nav>
      <div className="glass-panel rounded-lg border p-6">
        <div className="flex flex-col gap-3">
          <h1 className="font-display text-text-primary text-2xl font-semibold">
            {lesson.title}
          </h1>

          {lesson.lessonType === "challenge" && (
            <p className="text-text-secondary text-sm">
              This is a coding challenge lesson. Challenge runner UI is planned
              for a later phase.
            </p>
          )}

          {lesson.lessonType !== "challenge" && paragraphs.length === 0 && (
            <p className="text-text-secondary text-sm">No lesson content yet.</p>
          )}

          {lesson.lessonType !== "challenge" && paragraphs.length > 0 && (
            <div className="prose prose-invert max-w-none">
              {paragraphs.map((p, idx) => (
                <p key={idx} className="text-text-secondary leading-relaxed">
                  {p}
                </p>
              ))}
            </div>
          )}

          <div className="mt-2">
            <Link
              href={`/courses/${slug}`}
              className="text-solana text-sm hover:underline"
            >
              ← Back to course
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
