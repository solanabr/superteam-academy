'use client';

import { useCallback, useState } from 'react';
import { useTranslations } from 'next-intl';
import { CheckCircle2, Loader2, ArrowRight, Trophy } from 'lucide-react';
import { useRouter } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { useEnrollment } from '@/lib/hooks/use-enrollment';
import { useStreak } from '@/lib/hooks/use-streak';
import { XpToast } from '@/components/gamification/xp-toast';
import { ConfettiAnimation } from '@/components/gamification/confetti-animation';
import { LessonCompleteAnimation } from '@/components/gamification/lesson-complete-animation';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface LessonCompleteButtonProps {
  courseId: string;
  lessonIndex: number;
  isCompleted: boolean;
  isLastLesson: boolean;
  xpReward?: number;
  className?: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_XP_REWARD = 250;
const AUTO_ADVANCE_DELAY_MS = 2000;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function LessonCompleteButton({
  courseId,
  lessonIndex,
  isCompleted: initialCompleted,
  isLastLesson,
  xpReward = DEFAULT_XP_REWARD,
  className,
}: LessonCompleteButtonProps) {
  const t = useTranslations('lesson');
  const router = useRouter();
  const { completeLesson, isLoading } = useEnrollment(courseId);
  const { recordActivity } = useStreak();

  const [isCompleted, setIsCompleted] = useState(initialCompleted);
  const [showXpToast, setShowXpToast] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showCheckAnimation, setShowCheckAnimation] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleComplete = useCallback(async () => {
    if (isCompleted || isLoading) return;

    setError(null);

    try {
      await completeLesson(lessonIndex);
      setIsCompleted(true);

      // Record streak activity
      recordActivity();

      // Trigger celebrations
      setShowXpToast(true);
      setShowConfetti(true);
      setShowCheckAnimation(true);

      // Auto-advance after delay
      setTimeout(() => {
        if (isLastLesson) {
          router.push(`/courses/${courseId}`);
        } else {
          router.push(`/courses/${courseId}/lessons/${lessonIndex + 1}`);
        }
      }, AUTO_ADVANCE_DELAY_MS);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to complete lesson';
      setError(message);
    }
  }, [
    isCompleted,
    isLoading,
    completeLesson,
    lessonIndex,
    recordActivity,
    isLastLesson,
    courseId,
    router,
  ]);

  return (
    <>
      {/* Celebration effects */}
      {showXpToast && <XpToast amount={xpReward} />}
      <ConfettiAnimation trigger={showConfetti} />

      <div className={cn('flex flex-col items-center gap-2', className)}>
        {/* Checkmark animation on fresh completion */}
        {showCheckAnimation && (
          <LessonCompleteAnimation
            xp={xpReward}
            onComplete={() => setShowCheckAnimation(false)}
          />
        )}

        {isCompleted ? (
          <Button
            disabled
            variant="outline"
            size="lg"
            className="w-full gap-2 border-emerald-500/30 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400"
          >
            <CheckCircle2 className="size-5" />
            {t('completed')}
          </Button>
        ) : (
          <Button
            onClick={handleComplete}
            disabled={isLoading}
            size="lg"
            className="w-full gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="size-5 animate-spin" />
                {t('completing')}
              </>
            ) : isLastLesson ? (
              <>
                <Trophy className="size-5" />
                {t('complete')}
              </>
            ) : (
              <>
                {t('complete')}
                <ArrowRight className="size-5" />
              </>
            )}
          </Button>
        )}

        {/* Error state */}
        {error && (
          <p className="text-center text-xs text-destructive" role="alert">
            {error}
          </p>
        )}
      </div>
    </>
  );
}
