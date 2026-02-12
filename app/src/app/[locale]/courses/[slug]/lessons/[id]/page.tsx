import { setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { LessonView } from './lesson-view';

type Props = { params: Promise<{ locale: string; slug: string; id: string }> };

export default async function LessonPage({ params }: Props) {
  const { locale, slug, id } = await params;
  setRequestLocale(locale);
  const lessonIndex = parseInt(id, 10) || 0;
  const courseTitle = slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col sm:h-[calc(100vh-4rem)]">
      {/* Top bar: breadcrumb + nav */}
      <div className="flex shrink-0 items-center justify-between gap-4 border-b border-border bg-background/95 px-4 py-3 backdrop-blur sm:px-6">
        <div className="flex min-w-0 items-center gap-2 text-sm">
          <Link
            href={`/courses/${slug}`}
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            {courseTitle}
          </Link>
          <span className="text-muted-foreground">/</span>
          <span className="truncate font-medium">Lesson {lessonIndex + 1}</span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Link
            href={lessonIndex > 0 ? `/courses/${slug}/lessons/${lessonIndex - 1}` : `/courses/${slug}`}
          >
            <span className="inline-flex h-9 items-center rounded-lg border border-border bg-card px-3 text-sm font-medium hover:bg-muted/50">
              Previous
            </span>
          </Link>
          <Link href={`/courses/${slug}/lessons/${lessonIndex + 1}`}>
            <span className="inline-flex h-9 items-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90">
              Next
            </span>
          </Link>
        </div>
      </div>

      {/* Content + editor */}
      <div className="min-h-0 flex-1 overflow-hidden">
        <LessonView courseSlug={slug} lessonIndex={lessonIndex} />
      </div>
    </div>
  );
}
