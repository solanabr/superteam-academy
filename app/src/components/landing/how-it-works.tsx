'use client';

import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { Wallet, Code2, Award, Sparkles } from 'lucide-react';

interface Step {
  titleKey: 'step_1_title' | 'step_2_title' | 'step_3_title';
  descKey: 'step_1_desc' | 'step_2_desc' | 'step_3_desc';
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  number: number;
}

const STEPS: Step[] = [
  {
    titleKey: 'step_1_title',
    descKey: 'step_1_desc',
    icon: Wallet,
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary',
    number: 1,
  },
  {
    titleKey: 'step_2_title',
    descKey: 'step_2_desc',
    icon: Code2,
    iconBg: 'bg-accent/10',
    iconColor: 'text-accent',
    number: 2,
  },
  {
    titleKey: 'step_3_title',
    descKey: 'step_3_desc',
    icon: Award,
    iconBg: 'bg-yellow-500/10',
    iconColor: 'text-yellow-600 dark:text-yellow-400',
    number: 3,
  },
];

export function HowItWorks() {
  const t = useTranslations('landing');

  return (
    <section
      className="relative overflow-hidden bg-muted/30 py-16 md:py-24"
      aria-labelledby="how-it-works-heading"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="flex flex-col items-center gap-4 text-center">
          <Badge variant="outline" className="gap-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            Simple Process
          </Badge>
          <h2
            id="how-it-works-heading"
            className="text-3xl font-bold tracking-tight sm:text-4xl"
          >
            {t('how_it_works')}
          </h2>
          <p className="max-w-2xl text-muted-foreground">
            From wallet connection to on-chain credentials in three simple steps.
          </p>
        </div>

        {/* Steps */}
        <div className="relative mt-16">
          {/* Connecting line (desktop) */}
          <div className="absolute left-0 right-0 top-16 hidden h-px bg-border lg:block" />

          <div className="grid gap-12 lg:grid-cols-3 lg:gap-8">
            {STEPS.map((step, idx) => (
              <div key={step.titleKey} className="relative flex flex-col items-center text-center">
                {/* Mobile connecting line */}
                {idx < STEPS.length - 1 && (
                  <div className="absolute left-1/2 top-[72px] h-12 w-px -translate-x-1/2 bg-border lg:hidden" />
                )}

                {/* Step number + icon */}
                <div className="relative mb-6">
                  <div
                    className={`flex h-14 w-14 items-center justify-center rounded-2xl ${step.iconBg} ring-4 ring-background`}
                  >
                    <step.icon className={`h-6 w-6 ${step.iconColor}`} />
                  </div>
                  {/* Step number badge */}
                  <div className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    {step.number}
                  </div>
                </div>

                {/* Content */}
                <h3 className="mb-2 text-lg font-semibold">{t(step.titleKey)}</h3>
                <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
                  {t(step.descKey)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
