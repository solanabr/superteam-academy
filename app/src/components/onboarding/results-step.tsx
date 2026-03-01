'use client';

import { useTranslations } from 'next-intl';
import { ArrowRight, Trophy, BookOpen, Target } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { Recommendation, Track } from '@/lib/utils/recommendation';

interface ResultsStepProps {
  recommendation: Recommendation;
}

const TRACK_META: Record<Track, { label: string; gradient: string }> = {
  'solana-core': {
    label: 'Solana Core',
    gradient: 'from-purple-600 to-indigo-700',
  },
  defi: {
    label: 'DeFi',
    gradient: 'from-blue-600 to-teal-600',
  },
  nft: {
    label: 'NFT',
    gradient: 'from-pink-600 to-orange-500',
  },
  security: {
    label: 'Security',
    gradient: 'from-orange-600 to-yellow-600',
  },
};

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
  intermediate: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
  advanced: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400',
};

export function ResultsStep({ recommendation }: ResultsStepProps) {
  const t = useTranslations('onboarding');
  const trackMeta = TRACK_META[recommendation.primaryTrack];

  return (
    <div className="flex flex-col gap-6">
      {/* Recommended track banner */}
      <div
        className={cn(
          'flex flex-col items-center gap-3 rounded-xl bg-gradient-to-br p-6 text-white',
          trackMeta.gradient,
        )}
      >
        <Trophy className="size-10" />
        <h3 className="text-xl font-bold">{t('recommended_track')}</h3>
        <span className="text-2xl font-bold">{trackMeta.label}</span>
        <Badge
          variant="secondary"
          className={cn('border-0', DIFFICULTY_COLORS[recommendation.suggestedDifficulty])}
        >
          {t(`difficulty_${recommendation.suggestedDifficulty}`)}
        </Badge>
      </div>

      {/* Summary */}
      <p className="text-muted-foreground text-center text-sm leading-relaxed">
        {recommendation.summary}
      </p>

      {/* Recommended courses */}
      <div className="flex flex-col gap-3">
        <h3 className="flex items-center gap-2 text-lg font-semibold">
          <BookOpen className="size-5" />
          {t('recommended_courses')}
        </h3>

        {recommendation.courses.map((course) => (
          <Card key={course.id} className="transition-colors hover:border-primary/20">
            <CardContent className="flex items-center gap-4 p-4">
              <div
                className={cn(
                  'flex size-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-white',
                  TRACK_META[course.track].gradient,
                )}
              >
                <Target className="size-5" />
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="font-semibold">{course.title}</span>
                <span className="text-muted-foreground line-clamp-1 text-sm">
                  {course.description}
                </span>
              </div>
              <Badge
                variant="outline"
                className={cn('shrink-0 border-0', DIFFICULTY_COLORS[course.difficulty])}
              >
                {course.difficulty}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* CTA */}
      <Button size="lg" className="w-full" asChild>
        <Link href="/courses">
          {t('start_learning')}
          <ArrowRight className="ml-1.5 size-4" />
        </Link>
      </Button>
    </div>
  );
}
