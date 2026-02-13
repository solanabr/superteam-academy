'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { useEffect, useMemo, useState } from 'react';
import { useI18n } from '@/components/i18n/i18n-provider';
import { trackEvent } from '@/lib/analytics';
import {
  getRegistrationRecord,
  REGISTRATION_CHANGED_EVENT
} from '@/lib/auth/registration-storage';
import { learningProgressService } from '@/lib/services';
import { CourseDetail } from '@/lib/types';

export function CourseDetailPageClient({ course }: { course: CourseDetail }): JSX.Element {
  const { dictionary } = useI18n();
  const [registration, setRegistration] = useState<ReturnType<typeof getRegistrationRecord>>(null);
  const [ready, setReady] = useState<boolean>(false);
  const [enrolled, setEnrolled] = useState<boolean>(false);
  const [enrolling, setEnrolling] = useState<boolean>(false);
  const [status, setStatus] = useState<string>('');

  useEffect(() => {
    function syncRegistration(): void {
      setRegistration(getRegistrationRecord());
    }

    syncRegistration();
    setReady(true);
    window.addEventListener(REGISTRATION_CHANGED_EVENT, syncRegistration);

    return () => {
      window.removeEventListener(REGISTRATION_CHANGED_EVENT, syncRegistration);
    };
  }, []);

  const userId = useMemo<string>(() => {
    if (!registration) {
      return '';
    }

    return registration.id;
  }, [registration]);

  useEffect(() => {
    if (!ready || !userId) {
      setEnrolled(false);
      return;
    }

    let active = true;

    async function loadEnrollment(): Promise<void> {
      const value = await learningProgressService.getEnrollment(userId, course.id);
      if (!active) {
        return;
      }
      setEnrolled(value);
    }

    void loadEnrollment();

    return () => {
      active = false;
    };
  }, [course.id, ready, userId]);

  async function handleEnroll(): Promise<void> {
    if (!userId) {
      setStatus(dictionary.courses.detailRegisterRequired);
      return;
    }

    setEnrolling(true);
    await learningProgressService.enrollCourse(userId, course.id);
    trackEvent('course_enrolled', { courseId: course.id });
    setEnrolled(true);
    setStatus(dictionary.courses.detailEnrollSuccess);
    setEnrolling(false);
  }

  const localizedDifficulty =
    course.difficulty === 'beginner'
      ? dictionary.courses.difficultyBeginner
      : course.difficulty === 'intermediate'
        ? dictionary.courses.difficultyIntermediate
        : dictionary.courses.difficultyAdvanced;
  const staticReviews = [
    {
      id: 'r1',
      author: 'Ana S.',
      comment: dictionary.courses.detailReviewOne
    },
    {
      id: 'r2',
      author: 'Bruno A.',
      comment: dictionary.courses.detailReviewTwo
    },
    {
      id: 'r3',
      author: 'Camila M.',
      comment: dictionary.courses.detailReviewThree
    }
  ];

  return (
    <div className="space-y-6">
      <header className="panel relative overflow-hidden">
        <div className="absolute -right-14 top-0 h-32 w-32 rounded-full bg-accent/15 blur-3xl" />
        <p className="chip w-fit border-accent/30 bg-accent/10 uppercase tracking-wide text-accent">{course.path}</p>
        <h1 className="mt-2 text-3xl font-extrabold">{course.title}</h1>
        <p className="mt-2 max-w-3xl text-sm text-foreground/75">{course.description}</p>
        <div className="mt-4 flex flex-wrap gap-2 text-xs text-foreground/70">
          <span className="chip capitalize">{localizedDifficulty}</span>
          <span className="chip">{Math.round(course.durationMinutes / 60)}h</span>
          <span className="chip">{course.xpTotal} XP</span>
          <span className="chip">
            {dictionary.courses.detailInstructorLabel}: {course.instructor}
          </span>
        </div>
      </header>

      <section className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="panel space-y-4 p-5">
          <h2 className="text-xl font-semibold">{dictionary.courses.detailModulesLessons}</h2>
          {course.modules.length === 0 ? (
            <p className="text-sm text-foreground/75">{dictionary.courses.detailNoModules}</p>
          ) : null}
          {course.modules.map((moduleItem) => (
            <div key={moduleItem.id} className="space-y-2 rounded-xl border border-border/70 bg-background/45 p-3">
              <h3 className="text-sm font-semibold">{moduleItem.title}</h3>
              <ul className="space-y-2">
                {moduleItem.lessons.map((lesson) => (
                  <li key={lesson.id} className="flex items-center justify-between rounded-lg border border-border/60 bg-background/65 px-3 py-2">
                    <div>
                      <p className="text-sm font-medium">{lesson.title}</p>
                      <p className="text-xs text-foreground/70">
                        {lesson.type === 'challenge' ? dictionary.courses.lessonTypeChallenge : dictionary.courses.lessonTypeContent} • {lesson.xpReward} XP
                      </p>
                    </div>
                    <Link
                      href={`/courses/${course.slug}/lessons/${lesson.id}` as Route}
                      className="btn-secondary px-3 py-1 text-xs"
                    >
                      {dictionary.courses.detailOpenLesson}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <aside className="panel space-y-4 p-5">
          <h2 className="text-lg font-semibold">{dictionary.courses.detailLearningOutcomes}</h2>
          {course.learningOutcomes.length > 0 ? (
            <ul className="space-y-2 text-sm text-foreground/75">
              {course.learningOutcomes.map((outcome) => (
                <li key={outcome} className="rounded-lg border border-border/60 bg-muted/35 px-3 py-2">
                  {outcome}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-foreground/75">{dictionary.courses.detailNoOutcomes}</p>
          )}

          {userId ? (
            <button
              type="button"
              onClick={() => void handleEnroll()}
              disabled={enrolling || enrolled}
              className="btn-primary w-full disabled:opacity-60"
            >
              {enrolled
                ? dictionary.courses.detailEnrolled
                : enrolling
                  ? dictionary.courses.detailEnrolling
                  : dictionary.courses.detailEnroll}
            </button>
          ) : (
            <Link href="/register" className="btn-primary w-full">
              {dictionary.courses.detailRegisterRequired}
            </Link>
          )}

          {status ? <p className="text-xs text-foreground/70">{status}</p> : null}
        </aside>
      </section>

      <section className="panel space-y-4 p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold">{dictionary.courses.detailReviewsTitle}</h2>
          <p className="text-xs text-foreground/60">{dictionary.courses.detailReviewVerified}</p>
        </div>
        <p className="text-sm text-foreground/75">{dictionary.courses.detailReviewsSubtitle}</p>

        <div className="grid gap-3 md:grid-cols-3">
          {staticReviews.map((review) => (
            <article key={review.id} className="panel-soft space-y-2 bg-background/45 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">{review.author}</p>
                <p className="text-xs text-amber-400">★★★★★</p>
              </div>
              <p className="text-sm text-foreground/75">{review.comment}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
