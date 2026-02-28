'use client';

import { useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useWallet } from '@solana/wallet-adapter-react';
import {
  Wallet,
  Loader2,
  ArrowRight,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { Link } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { useEnrollment } from '@/lib/hooks/use-enrollment';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface EnrollButtonProps {
  courseId: string;
  totalXp: number;
  prerequisiteCourseId?: string | null;
  className?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function EnrollButton({
  courseId,
  totalXp,
  prerequisiteCourseId,
  className,
}: EnrollButtonProps) {
  const t = useTranslations('courses');
  const tCommon = useTranslations('common');
  const { connected } = useWallet();
  const { enrollment, isEnrolled, enroll, isLoading } =
    useEnrollment(courseId);

  const isFinalized = enrollment?.isFinalized ?? false;

  const handleEnroll = useCallback(async () => {
    try {
      await enroll(prerequisiteCourseId ?? undefined);
      toast.success(t('enroll_success'), {
        description: t('enroll_success_desc'),
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Enrollment failed';
      toast.error(t('enroll_error'), { description: message });
    }
  }, [enroll, prerequisiteCourseId, t]);

  // State: no wallet connected
  if (!connected) {
    return (
      <div className={cn('flex flex-col gap-2', className)}>
        <Button size="lg" className="w-full gap-2" disabled>
          <Wallet className="size-4" />
          {tCommon('connect_wallet')}
        </Button>
        <p className="text-muted-foreground text-center text-xs">
          {t('connect_to_enroll')}
        </p>
      </div>
    );
  }

  // State: course completed
  if (isFinalized) {
    return (
      <Button
        size="lg"
        className={cn(
          'w-full gap-2 bg-emerald-600 text-white hover:bg-emerald-700',
          className,
        )}
        disabled
      >
        <CheckCircle2 className="size-4" />
        {t('completed')}
      </Button>
    );
  }

  // State: already enrolled (continue learning)
  if (isEnrolled) {
    const nextLesson = enrollment?.completedLessons ?? 0;
    return (
      <Button size="lg" className={cn('w-full gap-2', className)} asChild>
        <Link href={`/courses/${courseId}/lessons/${nextLesson}`}>
          {t('continue')}
          <ArrowRight className="size-4" />
        </Link>
      </Button>
    );
  }

  // State: not enrolled (enroll CTA)
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <Button
        size="lg"
        className="w-full gap-2"
        onClick={handleEnroll}
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            {t('enrolling')}
          </>
        ) : (
          <>
            <Sparkles className="size-4" />
            {t('enroll')}
          </>
        )}
      </Button>
      <p className="text-muted-foreground flex items-center justify-center gap-1 text-xs">
        <Sparkles className="size-3" />
        {t('earn_xp', { amount: totalXp })}
      </p>
    </div>
  );
}
