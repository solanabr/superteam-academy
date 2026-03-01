'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface QuizStepProps {
  step: number;
  totalSteps: number;
  title: string;
  children: React.ReactNode;
  onNext: () => void;
  onBack: () => void;
  canProceed: boolean;
  isFirstStep: boolean;
  isLastStep: boolean;
}

export function QuizStep({
  step,
  totalSteps,
  title,
  children,
  onNext,
  onBack,
  canProceed,
  isFirstStep,
  isLastStep,
}: QuizStepProps) {
  const t = useTranslations('onboarding');
  const progressPercent = ((step - 1) / (totalSteps - 1)) * 100;

  return (
    <div className="flex flex-col gap-6">
      {/* Progress */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {t('step_of', { current: step, total: totalSteps })}
          </span>
          <span className="text-muted-foreground tabular-nums">
            {Math.round(progressPercent)}%
          </span>
        </div>
        <Progress value={progressPercent} className="h-2" />
      </div>

      {/* Title */}
      <h2 className="text-2xl font-bold tracking-tight">{title}</h2>

      {/* Content */}
      <div className="min-h-[280px]">{children}</div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={onBack}
          disabled={isFirstStep}
        >
          {t('back')}
        </Button>

        <Button
          onClick={onNext}
          disabled={!canProceed}
        >
          {isLastStep ? t('see_results') : t('next')}
        </Button>
      </div>
    </div>
  );
}
