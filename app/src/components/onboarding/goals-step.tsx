'use client';

import { useTranslations } from 'next-intl';
import { BookOpen, Hammer, Award, Briefcase, Heart } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { Goal } from '@/lib/utils/recommendation';

interface GoalsStepProps {
  value: Goal | null;
  onChange: (value: Goal) => void;
}

const GOALS: {
  value: Goal;
  icon: React.ComponentType<{ className?: string }>;
  labelKey: string;
  descKey: string;
}[] = [
  {
    value: 'learn-fundamentals',
    icon: BookOpen,
    labelKey: 'goal_fundamentals',
    descKey: 'goal_fundamentals_desc',
  },
  {
    value: 'build-dapps',
    icon: Hammer,
    labelKey: 'goal_dapps',
    descKey: 'goal_dapps_desc',
  },
  {
    value: 'get-certified',
    icon: Award,
    labelKey: 'goal_certified',
    descKey: 'goal_certified_desc',
  },
  {
    value: 'career-change',
    icon: Briefcase,
    labelKey: 'goal_career',
    descKey: 'goal_career_desc',
  },
  {
    value: 'contribute-ecosystem',
    icon: Heart,
    labelKey: 'goal_contribute',
    descKey: 'goal_contribute_desc',
  },
];

export function GoalsStep({ value, onChange }: GoalsStepProps) {
  const t = useTranslations('onboarding');

  return (
    <div className="flex flex-col gap-3">
      {GOALS.map((goal) => {
        const Icon = goal.icon;
        const isSelected = value === goal.value;

        return (
          <Card
            key={goal.value}
            role="radio"
            aria-checked={isSelected}
            tabIndex={0}
            className={cn(
              'cursor-pointer transition-all hover:border-primary/40',
              isSelected && 'border-primary bg-primary/5 ring-2 ring-primary/20',
            )}
            onClick={() => onChange(goal.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onChange(goal.value);
              }
            }}
          >
            <CardContent className="flex items-center gap-3 p-4">
              <div
                className={cn(
                  'flex size-10 shrink-0 items-center justify-center rounded-lg',
                  isSelected
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground',
                )}
              >
                <Icon className="size-5" />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="font-semibold">{t(goal.labelKey)}</span>
                <span className="text-muted-foreground text-sm">{t(goal.descKey)}</span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
