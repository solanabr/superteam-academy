import Link from 'next/link';
import { useI18n } from '@/components/i18n/i18n-provider';
import { CourseSummary } from '@/lib/types';
import { cn } from '@/lib/utils';

const difficultyStyles: Record<CourseSummary['difficulty'], string> = {
  beginner: 'border-emerald-500/35 bg-emerald-500/12 text-emerald-400',
  intermediate: 'border-amber-500/35 bg-amber-500/12 text-amber-400',
  advanced: 'border-rose-500/35 bg-rose-500/12 text-rose-400'
};

export function CourseCard({
  course,
  progressPercentage
}: {
  course: CourseSummary;
  progressPercentage?: number;
}): JSX.Element {
  const { dictionary } = useI18n();
  const localizedDifficulty =
    course.difficulty === 'beginner'
      ? dictionary.courses.difficultyBeginner
      : course.difficulty === 'intermediate'
        ? dictionary.courses.difficultyIntermediate
        : dictionary.courses.difficultyAdvanced;

  return (
    <article className="group panel p-5 transition hover:-translate-y-0.5 hover:border-primary/35">
      <div className="mb-4 flex items-start justify-between gap-3">
        <span className={cn('rounded-full border px-3 py-1 text-xs font-semibold capitalize', difficultyStyles[course.difficulty])}>
          {localizedDifficulty}
        </span>
        <span className="chip">{Math.round(course.durationMinutes / 60)}h</span>
      </div>

      <h3 className="text-lg font-bold">{course.title}</h3>
      <p className="mt-2 text-sm text-foreground/75">{course.description}</p>

      <div className="mt-4 flex items-center justify-between text-xs text-foreground/70">
        <span className="rounded-lg bg-muted/60 px-2.5 py-1">{course.path}</span>
        <span className="font-semibold text-primary">{course.xpTotal} XP</span>
      </div>

      {typeof progressPercentage === 'number' ? (
        <div className="mt-4 space-y-1">
          <div className="h-2 rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary" style={{ width: `${progressPercentage}%` }} />
          </div>
          <p className="text-xs text-foreground/70">{`${progressPercentage}${dictionary.courses.completeSuffix}`}</p>
        </div>
      ) : null}

      <Link
        href={`/courses/${course.slug}`}
        className="btn-primary mt-5"
      >
        {dictionary.courses.viewCourse}
      </Link>
    </article>
  );
}
