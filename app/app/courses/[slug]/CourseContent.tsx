'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { useState, useEffect, useRef } from 'react';
import type { Course, Lesson } from '@/lib/data/courses';
import { recordActivity } from '@/lib/services';

interface Props {
  course: Course;
}

const XP_PER_LESSON_FALLBACK = 25;

export function CourseContent({ course }: Props) {
  const { publicKey } = useWallet();
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [progressLoading, setProgressLoading] = useState(true);
  const [completingLessonId, setCompletingLessonId] = useState<string | null>(null);
  const [justCompletedId, setJustCompletedId] = useState<string | null>(null);
  const completedFeedbackTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const xpPerLesson =
    course.lessons.length > 0
      ? Math.max(1, Math.floor(course.xpReward / course.lessons.length))
      : XP_PER_LESSON_FALLBACK;

  useEffect(() => {
    if (!publicKey) {
      setCompletedIds([]);
      setProgressLoading(false);
      return;
    }
    setProgressLoading(true);
    const wallet = publicKey.toBase58();
    fetch(`/api/progress?wallet=${encodeURIComponent(wallet)}`)
      .then((r) => r.json())
      .then((data) => {
        const list = data.completedLessons?.[course.id] ?? [];
        setCompletedIds(list);
      })
      .catch(() => setCompletedIds([]))
      .finally(() => setProgressLoading(false));
  }, [publicKey, course.id]);

  const markComplete = async (lessonId: string) => {
    if (!publicKey) return;
    setCompletingLessonId(lessonId);
    const wallet = publicKey.toBase58();
    const res = await fetch('/api/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wallet, courseId: course.id, lessonId }),
    });
    if (!res.ok) {
      setCompletingLessonId(null);
      return;
    }
    recordActivity(wallet, 1);
    setCompletedIds((prev) =>
      prev.includes(lessonId) ? prev : [...prev, lessonId]
    );
    setCompletingLessonId(null);
    setJustCompletedId(lessonId);
    if (completedFeedbackTimeout.current) clearTimeout(completedFeedbackTimeout.current);
    completedFeedbackTimeout.current = setTimeout(() => setJustCompletedId(null), 2500);
  };

  const progress =
    course.lessons.length > 0
      ? Math.round((completedIds.length / course.lessons.length) * 100)
      : 0;

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border/50 bg-surface p-5">
        <div className="text-caption mb-2 flex justify-between text-[rgb(var(--text-muted))]">
          <span>Your progress</span>
          {progressLoading && publicKey ? (
            <span className="animate-pulse">…</span>
          ) : (
            <span>{progress}%</span>
          )}
        </div>
        <div
          className="h-2 overflow-hidden rounded-full bg-surface-elevated"
          role="progressbar"
          aria-valuenow={progressLoading ? undefined : progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={progressLoading && publicKey ? 'Loading progress' : 'Course progress'}
        >
          <div
            className="h-full rounded-full bg-accent transition-all duration-300"
            style={{
              width: progressLoading && publicKey ? '33%' : `${progress}%`,
            }}
          />
          {progressLoading && publicKey && (
            <span className="sr-only">Loading</span>
          )}
        </div>
      </div>

      <div>
        <h2 className="text-title mb-4 font-semibold text-[rgb(var(--text))]">
          Lessons
        </h2>
        {progressLoading && publicKey ? (
          <ul className="space-y-2" aria-busy="true" aria-label="Loading lessons">
            {course.lessons.slice(0, 5).map((_, i) => (
              <li key={i} className="rounded-lg border border-border/50 bg-surface px-4 py-3.5">
                <div className="flex gap-3">
                  <div className="h-5 w-5 shrink-0 rounded-full bg-surface-elevated animate-pulse" />
                  <div className="h-5 flex-1 max-w-[60%] rounded bg-surface-elevated animate-pulse" />
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <ul className="space-y-2">
            {course.lessons.map((lesson) => (
              <LessonRow
                key={lesson.id}
                lesson={lesson}
                completed={completedIds.includes(lesson.id)}
                onComplete={() => markComplete(lesson.id)}
                walletConnected={!!publicKey}
                isCompleting={completingLessonId === lesson.id}
                justCompleted={justCompletedId === lesson.id}
                xpGain={xpPerLesson}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function LessonTypeIcon({ type }: { type: Lesson['type'] }) {
  if (type === 'video') return <span aria-hidden>▶</span>;
  if (type === 'read') return <span aria-hidden>📖</span>;
  if (type === 'quiz') return <span aria-hidden>✓?</span>;
  if (type === 'code') return <span aria-hidden>{"</>"}</span>;
  return null;
}

function LessonRow({
  lesson,
  completed,
  onComplete,
  walletConnected,
  isCompleting = false,
  justCompleted = false,
  xpGain = XP_PER_LESSON_FALLBACK,
}: {
  lesson: Lesson;
  completed: boolean;
  onComplete: () => void;
  walletConnected: boolean;
  isCompleting?: boolean;
  justCompleted?: boolean;
  xpGain?: number;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <li className="rounded-lg border border-border/50 bg-surface overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        aria-expanded={expanded}
        aria-label={expanded ? `Collapse ${lesson.title}` : `Expand ${lesson.title}`}
        className="text-body flex w-full items-center justify-between gap-4 px-4 py-3.5 text-left transition hover:bg-surface-elevated/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset"
      >
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <span
            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-medium ${
              completed
                ? 'border-success bg-success/15 text-success'
                : 'border-border text-[rgb(var(--text-subtle))]'
            }`}
            aria-label={completed ? 'Completed' : 'Not completed'}
          >
            {completed ? '✓' : ''}
          </span>
          <span className="font-medium text-[rgb(var(--text))] truncate">
            {lesson.title}
          </span>
          {justCompleted && (
            <span className="text-caption shrink-0 font-medium text-success" role="status">
              +{xpGain} XP
            </span>
          )}
          <span className="text-caption shrink-0 text-[rgb(var(--text-subtle))]">
            {lesson.duration}
          </span>
          <span className="text-caption shrink-0 flex items-center gap-1 rounded bg-surface-elevated px-2 py-0.5 text-[rgb(var(--text-muted))]" title={lesson.type}>
            <LessonTypeIcon type={lesson.type} />
            {lesson.type}
          </span>
        </div>
        <span className="text-caption shrink-0 text-[rgb(var(--text-subtle))]">
          {expanded ? '−' : '+'}
        </span>
      </button>
      {expanded && (
        <div className="border-t border-border/50 px-4 py-3">
          <p className="text-caption text-[rgb(var(--text-muted))]">
            {lesson.type === 'video' && 'Watch the video to complete this lesson.'}
            {lesson.type === 'read' && 'Read the content to complete this lesson.'}
            {lesson.type === 'quiz' && 'Pass the quiz to complete this lesson.'}
            {lesson.type === 'code' && 'Complete the exercise to finish this lesson.'}
          </p>
          {walletConnected && (
            <button
              type="button"
              onClick={onComplete}
              disabled={completed || isCompleting}
              aria-pressed={completed}
              aria-busy={isCompleting}
              className="text-caption mt-3 rounded-md border border-accent/40 bg-accent/10 px-3 py-1.5 font-medium text-accent transition hover:bg-accent/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:opacity-60"
            >
              {isCompleting ? 'Completing…' : completed ? 'Completed' : 'Mark complete'}
            </button>
          )}
          {!walletConnected && (
            <p className="text-caption mt-3 text-[rgb(var(--text-subtle))]">
              Connect your wallet to track progress.
            </p>
          )}
        </div>
      )}
    </li>
  );
}
