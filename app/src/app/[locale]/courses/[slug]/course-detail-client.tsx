'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { useRouter, Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { createStubLearningProgressService, getEnrolled, setEnrolled } from '@/lib/stub-learning-progress';
import { BookOpen, Check, ChevronRight, Clock, Sparkles } from 'lucide-react';

const TOTAL_LESSONS = 12;

type Module = { id: string; title: string; lessonCount: number; startIndex: number };

export function CourseDetailClient({
  slug,
  modules,
  title,
  difficultyLabel,
  duration,
  xpEarn,
}: {
  slug: string;
  modules: Module[];
  title: string;
  difficultyLabel: string;
  duration: string;
  xpEarn: number;
}) {
  const router = useRouter();
  const { publicKey } = useWallet();
  const [enrolled, setEnrolledState] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const userId = publicKey?.toBase58() ?? '';

  useEffect(() => {
    if (!userId) {
      setEnrolledState(false);
      setCompletedCount(0);
      setLoading(false);
      return;
    }
    const enrolledFlag = getEnrolled(userId, slug);
    setEnrolledState(enrolledFlag);
    const svc = createStubLearningProgressService();
    svc.getProgress(userId, slug).then((p) => {
      setCompletedCount(p.completedLessons);
      setLoading(false);
    });
  }, [userId, slug]);

  const progressPct = TOTAL_LESSONS > 0 ? Math.round((completedCount / TOTAL_LESSONS) * 100) : 0;

  function handleEnroll() {
    if (!userId) {
      router.push('/dashboard');
      return;
    }
    setEnrolled(userId, slug);
    setEnrolledState(true);
    router.push(`/courses/${slug}/lessons/0`);
  }

  function handleContinue() {
    router.push(`/courses/${slug}/lessons/${completedCount >= TOTAL_LESSONS ? 0 : completedCount}`);
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-10 sm:px-6">
      {/* Hero */}
      <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
        <div className="flex flex-wrap items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <BookOpen className="h-7 w-7" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
            <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Sparkles className="h-4 w-4" />
                {difficultyLabel}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {duration}
              </span>
              <span>{xpEarn} XP</span>
            </div>
          </div>
        </div>

        {/* Progress + CTA */}
        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {enrolled ? `${completedCount} / ${TOTAL_LESSONS} lessons` : 'Not enrolled yet'}
              </span>
              {enrolled && <span className="font-medium">{progressPct}%</span>}
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
          <div className="shrink-0">
            {loading ? (
              <Button disabled className="rounded-xl">Loading…</Button>
            ) : !publicKey ? (
              <Button className="rounded-xl" onClick={() => router.push('/dashboard')}>
                Connect wallet to enroll
              </Button>
            ) : enrolled ? (
              <Button className="gap-2 rounded-xl" onClick={handleContinue}>
                {completedCount >= TOTAL_LESSONS ? 'Review course' : 'Continue'}
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button className="gap-2 rounded-xl" onClick={handleEnroll}>
                <Check className="h-4 w-4" />
                Enroll & start course
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Curriculum */}
      <section className="mt-10">
        <h2 className="text-lg font-semibold">Curriculum</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {TOTAL_LESSONS} lessons · Complete them in order to earn XP
        </p>
        <ul className="mt-6 space-y-4">
          {modules.map((mod) => (
            <li
              key={mod.id}
              className="rounded-xl border border-border bg-card overflow-hidden"
            >
              <div className="flex items-center gap-3 px-4 py-3 font-medium">
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                {mod.title}
              </div>
              <ul className="border-t border-border">
                {Array.from({ length: mod.lessonCount }, (_, i) => {
                  const lessonIndex = mod.startIndex + i;
                  const isCompleted = enrolled && completedCount > lessonIndex;
                  return (
                    <li key={lessonIndex} className="border-t border-border/50 first:border-t-0">
                      <Link
                        href={`/courses/${slug}/lessons/${lessonIndex}`}
                        className="flex items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-muted/50"
                      >
                        {isCompleted ? (
                          <Check className="h-4 w-4 shrink-0 text-primary" />
                        ) : (
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-muted-foreground/50 text-xs text-muted-foreground">
                            {lessonIndex + 1}
                          </span>
                        )}
                        <span className={isCompleted ? 'text-muted-foreground' : ''}>
                          Lesson {lessonIndex + 1}
                          {lessonIndex === 0 ? ' — Introduction' : ` — Part ${lessonIndex + 1}`}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
