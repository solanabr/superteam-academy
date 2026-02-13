'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useI18n } from '@/components/i18n/i18n-provider';
import { ChallengePanel } from '@/components/lesson/challenge-panel';
import { MarkdownRenderer } from '@/components/lesson/markdown-renderer';
import { trackEvent } from '@/lib/analytics';
import {
  getRegistrationRecord,
  REGISTRATION_CHANGED_EVENT
} from '@/lib/auth/registration-storage';
import { Lesson } from '@/lib/types';
import { learningProgressService } from '@/lib/services';

interface LessonWorkspaceProps {
  courseId: string;
  courseSlug: string;
  courseTitle: string;
  lesson: Lesson;
  lessonIndex: number;
  previousLessonId: string | null;
  nextLessonId: string | null;
}

export function LessonWorkspace({
  courseId,
  courseSlug,
  courseTitle,
  lesson,
  lessonIndex,
  previousLessonId,
  nextLessonId
}: LessonWorkspaceProps): JSX.Element | null {
  const { dictionary } = useI18n();
  const [leftWidth, setLeftWidth] = useState<number>(58);
  const [completing, setCompleting] = useState<boolean>(false);
  const [statusText, setStatusText] = useState<string>(dictionary.lesson.autosaveEnabled);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [registration, setRegistration] = useState<ReturnType<typeof getRegistrationRecord>>(null);
  const [ready, setReady] = useState<boolean>(false);

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

  const hasAccount = Boolean(registration);
  const hasLinkedWallet = Boolean(registration?.walletAddress);
  const userId = registration?.id ?? '';

  function beginResize(startClientX: number): void {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const rect = container.getBoundingClientRect();

    function onMove(event: MouseEvent): void {
      const deltaX = event.clientX - startClientX;
      const nextWidth = ((rect.width * (leftWidth / 100) + deltaX) / rect.width) * 100;
      setLeftWidth(Math.min(75, Math.max(35, nextWidth)));
    }

    function onUp(): void {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    }

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }

  async function markComplete(): Promise<void> {
    if (!hasAccount || !userId) {
      setStatusText(dictionary.lesson.registerRequiredStatus);
      return;
    }

    if (!hasLinkedWallet) {
      setStatusText(dictionary.lesson.walletRequiredStatus);
      return;
    }

    setCompleting(true);
    setStatusText(dictionary.lesson.completionRecording);

    const enrolled = await learningProgressService.getEnrollment(userId, courseId);
    if (!enrolled) {
      setStatusText(dictionary.lesson.enrollRequiredStatus);
      setCompleting(false);
      return;
    }

    await learningProgressService.completeLesson(userId, courseId, lessonIndex);
    trackEvent('lesson_completed', { courseId, lessonId: lesson.id, lessonIndex });

    setStatusText(dictionary.lesson.completionSuccess.replace('{xp}', String(lesson.xpReward)));
    setCompleting(false);
  }

  const previousHref = useMemo<Route | null>(() => {
    if (!previousLessonId) {
      return null;
    }
    return `/courses/${courseSlug}/lessons/${previousLessonId}` as Route;
  }, [courseSlug, previousLessonId]);

  const nextHref = useMemo<Route | null>(() => {
    if (!nextLessonId) {
      return null;
    }
    return `/courses/${courseSlug}/lessons/${nextLessonId}` as Route;
  }, [courseSlug, nextLessonId]);

  if (!ready) {
    return null;
  }

  return (
    <div className="space-y-4">
      <header className="panel relative overflow-hidden p-4">
        <div className="absolute -right-20 -top-16 h-40 w-40 rounded-full bg-primary/12 blur-3xl" />
        <p className="chip w-fit border-accent/30 bg-accent/10 text-accent">{courseTitle} • {lesson.moduleTitle}</p>
        <h1 className="mt-1 text-2xl font-bold">{lesson.title}</h1>
        <p className="mt-2 text-sm text-foreground/75">{dictionary.lesson.completionAbstraction}</p>
      </header>

      <div ref={containerRef} className="relative flex min-h-[560px] flex-col gap-3 lg:min-h-[620px] lg:flex-row">
        <section style={{ width: `${leftWidth}%` }} className="panel p-4 lg:block">
          <MarkdownRenderer markdown={lesson.markdown} />
        </section>

        <button
          type="button"
          onMouseDown={(event) => beginResize(event.clientX)}
          className="hidden w-2 shrink-0 cursor-col-resize rounded-full bg-muted transition-colors hover:bg-primary/70 lg:block"
          aria-label={dictionary.lesson.resizePanelsAria}
        />

        <section style={{ width: `${100 - leftWidth}%` }} className="panel p-4">
          {lesson.type === 'challenge' ? (
            <ChallengePanel lesson={lesson} storageKey={`${courseId}:${lesson.id}:code`} />
          ) : (
            <div className="space-y-3">
              <h3 className="text-base font-semibold">{dictionary.lesson.lessonTips}</h3>
              <details className="panel-soft text-sm">
                <summary className="cursor-pointer font-medium">{dictionary.lesson.hintOne}</summary>
                {dictionary.lesson.hintOneBody}
              </details>
              <details className="panel-soft text-sm">
                <summary className="cursor-pointer font-medium">{dictionary.lesson.solutionToggle}</summary>
                {dictionary.lesson.solutionBody}
              </details>
            </div>
          )}
        </section>
      </div>

      <div className="panel flex flex-wrap items-center justify-between gap-2 p-3">
        {previousHref ? (
          <Link href={previousHref} className="btn-secondary px-3 py-2 text-xs">
            {dictionary.common.previous}
          </Link>
        ) : (
          <span />
        )}

        <button
          type="button"
          onClick={() => void markComplete()}
          disabled={completing || !hasAccount || !hasLinkedWallet}
          className="btn-primary px-4 py-2 text-xs disabled:opacity-60"
        >
          {!hasAccount
            ? dictionary.lesson.registerToUnlock
            : !hasLinkedWallet
            ? dictionary.lesson.linkWalletToUnlock
            : completing
            ? dictionary.common.saving
            : `${dictionary.lesson.markCompleteLabel} (+${lesson.xpReward} XP)`}
        </button>

        {nextHref ? (
          <Link href={nextHref} className="btn-secondary px-3 py-2 text-xs">
            {dictionary.common.next}
          </Link>
        ) : null}
      </div>

      {!hasAccount ? (
        <p className="text-xs text-foreground/70">
          {dictionary.lesson.registerPrompt}{' '}
          <Link href="/register" className="underline">
            /register
          </Link>
        </p>
      ) : !hasLinkedWallet ? (
        <p className="text-xs text-foreground/70">
          {dictionary.lesson.linkWalletPrompt}{' '}
          <Link href="/settings" className="underline">
            /settings
          </Link>
        </p>
      ) : null}

      <p className="text-xs text-foreground/70">{statusText}</p>
    </div>
  );
}
