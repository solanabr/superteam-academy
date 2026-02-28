'use client';

import { useTranslations } from 'next-intl';
import { Baby, Code2, Globe, Rocket } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { ExperienceLevel } from '@/lib/utils/recommendation';

interface ExperienceStepProps {
  value: ExperienceLevel | null;
  onChange: (value: ExperienceLevel) => void;
}

const OPTIONS: {
  value: ExperienceLevel;
  icon: React.ComponentType<{ className?: string }>;
  labelKey: string;
  descKey: string;
}[] = [
  {
    value: 'complete-beginner',
    icon: Baby,
    labelKey: 'exp_beginner',
    descKey: 'exp_beginner_desc',
  },
  {
    value: 'some-programming',
    icon: Code2,
    labelKey: 'exp_programmer',
    descKey: 'exp_programmer_desc',
  },
  {
    value: 'crypto-familiar',
    icon: Globe,
    labelKey: 'exp_crypto',
    descKey: 'exp_crypto_desc',
  },
  {
    value: 'solana-developer',
    icon: Rocket,
    labelKey: 'exp_solana',
    descKey: 'exp_solana_desc',
  },
];

export function ExperienceStep({ value, onChange }: ExperienceStepProps) {
  const t = useTranslations('onboarding');

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {OPTIONS.map((opt) => {
        const Icon = opt.icon;
        const isSelected = value === opt.value;

        return (
          <Card
            key={opt.value}
            role="radio"
            aria-checked={isSelected}
            tabIndex={0}
            className={cn(
              'cursor-pointer transition-all hover:border-primary/40',
              isSelected && 'border-primary bg-primary/5 ring-2 ring-primary/20',
            )}
            onClick={() => onChange(opt.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onChange(opt.value);
              }
            }}
          >
            <CardContent className="flex items-start gap-3 p-4">
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
                <span className="font-semibold">{t(opt.labelKey)}</span>
                <span className="text-muted-foreground text-sm">{t(opt.descKey)}</span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
