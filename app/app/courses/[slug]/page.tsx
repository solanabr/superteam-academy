import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Header } from '@/components/Header';
import { getCourseBySlug } from '@/lib/data/courses';
import { CourseContent } from './CourseContent';
import { EnrollmentCTA } from './EnrollmentCTA';
import { DIFFICULTY_LABELS } from '@/lib/data/courses';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const course = getCourseBySlug(slug);
  if (!course) return { title: 'Course not found' };
  return {
    title: course.title,
    description: course.description,
    openGraph: {
      title: course.title,
      description: course.description,
    },
  };
}

const MOCK_REVIEWS = [
  { author: 'Builder_42', rating: 5, text: 'Clear and practical. Got my first dApp deployed.', date: 'Feb 2026' },
  { author: 'SolanaDev', rating: 5, text: 'Best onboarding for Solana in PT.', date: 'Jan 2026' },
];

export default async function CoursePage({ params }: Props) {
  const { slug } = await params;
  const course = getCourseBySlug(slug);
  if (!course) notFound();

  return (
    <>
      <Header />
      <main id="main-content" className="mx-auto max-w-3xl px-4 py-8 sm:px-6" tabIndex={-1}>
        <nav aria-label="Breadcrumb" className="mb-6">
          <Link
            href="/courses"
            className="text-caption inline-flex items-center gap-1 text-[rgb(var(--text-muted))] no-underline transition hover:text-[rgb(var(--text))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 rounded"
          >
            ← Course catalog
          </Link>
        </nav>

        <article className="rounded-xl border border-border/50 bg-surface shadow-card">
          <div className="h-2 w-full rounded-t-xl bg-accent/20" aria-hidden />
          <div className="p-6 sm:p-8">
            <div className="mb-3 flex flex-wrap gap-2">
              <span className="text-caption rounded bg-accent/20 px-2 py-0.5 font-medium text-accent">
                {DIFFICULTY_LABELS[course.difficulty]}
              </span>
              <span className="text-caption text-[rgb(var(--text-subtle))]">
                {course.duration} · {course.xpReward} XP to earn
              </span>
            </div>
            <h1 className="text-title font-semibold text-[rgb(var(--text))]">
              {course.title}
            </h1>
            <p className="text-body mt-2 text-[rgb(var(--text-muted))]">
              {course.description}
            </p>
            <div className="text-caption mt-4 flex flex-wrap gap-x-6 gap-y-1 text-[rgb(var(--text-subtle))]">
              <span>{course.instructor}</span>
              <span>{course.lessons.length} lessons</span>
            </div>
            <EnrollmentCTA course={course} />
          </div>
        </article>

        <div className="mt-8">
          <CourseContent course={course} />
        </div>

        {/* Reviews (static MVP) */}
        <section className="mt-10 rounded-xl border border-border/50 bg-surface p-6">
          <h2 className="text-title mb-4 font-semibold text-[rgb(var(--text))]">
            Reviews
          </h2>
          <ul className="space-y-4">
            {MOCK_REVIEWS.map((r) => (
              <li key={r.author} className="border-b border-border/30 pb-4 last:border-0 last:pb-0">
                <div className="flex items-center gap-2">
                  <span className="text-caption font-medium text-[rgb(var(--text))]">{r.author}</span>
                  <span className="text-caption text-chart-3">★ {r.rating}</span>
                  <span className="text-caption text-[rgb(var(--text-subtle))]">{r.date}</span>
                </div>
                <p className="text-body mt-1 text-[rgb(var(--text-muted))]">{r.text}</p>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </>
  );
}
