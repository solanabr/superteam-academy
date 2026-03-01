'use client';

import { useTranslations } from 'next-intl';
import { BookOpen, Clock, Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { DifficultyBadge } from '@/components/courses/difficulty-badge';
import { TrackBadge } from '@/components/courses/track-badge';
import { cn } from '@/lib/utils';
import type { CourseWithMeta } from '@/lib/stores/course-store';

// ---------------------------------------------------------------------------
// Gradient map for course thumbnail placeholders based on trackId
// ---------------------------------------------------------------------------

const TRACK_GRADIENTS: Record<number, string> = {
  1: 'from-purple-600 via-violet-600 to-indigo-700',  // Solana Core
  2: 'from-blue-600 via-cyan-600 to-teal-600',        // DeFi
  3: 'from-pink-600 via-rose-500 to-orange-500',       // NFT
  4: 'from-orange-600 via-amber-600 to-yellow-600',    // Security
};

const DEFAULT_GRADIENT = 'from-primary via-primary/80 to-accent';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CourseCardProps {
  course: CourseWithMeta;
  enrollment?: {
    progressPercent: number;
    isFinalized: boolean;
  };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CourseCard({ course, enrollment }: CourseCardProps) {
  const t = useTranslations('courses');

  const gradient = TRACK_GRADIENTS[course.trackId] ?? DEFAULT_GRADIENT;
  const isEnrolled = !!enrollment;
  const isCompleted = enrollment?.isFinalized ?? false;

  return (
    <Link href={`/courses/${course.slug}`} className="group block">
      <Card className="gap-0 overflow-hidden border-transparent py-0 transition-all duration-200 hover:border-primary/20 hover:shadow-lg group-hover:scale-[1.01] dark:hover:border-primary/30">
        {/* Thumbnail / gradient header */}
        <div
          className={cn(
            'relative flex h-40 items-end bg-gradient-to-br p-4',
            gradient,
          )}
        >
          {course.imageUrl && (
            <img
              src={course.imageUrl}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
          )}
          {/* Track + Difficulty badges overlaid on gradient */}
          <div className="absolute top-3 right-3 left-3 flex items-start justify-between">
            <TrackBadge
              trackId={course.trackId}
              trackSlug={course.trackSlug}
              className="bg-black/30 text-white backdrop-blur-sm dark:bg-black/50 [&_svg]:text-white border-white/20"
            />
            <DifficultyBadge
              difficulty={course.difficulty}
              className="bg-black/30 text-white backdrop-blur-sm dark:bg-black/50 border-white/20"
            />
          </div>

          {/* Completion badge */}
          {isCompleted && (
            <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-emerald-500 px-2.5 py-1 text-xs font-medium text-white shadow-sm">
              <CheckCircle2 className="size-3.5" />
              {t('completed')}
            </div>
          )}
        </div>

        <CardContent className="flex flex-1 flex-col gap-3 p-4">
          {/* Title */}
          <h3 className="line-clamp-2 text-base font-semibold leading-tight tracking-tight">
            {course.title}
          </h3>

          {/* Description */}
          <p className="text-muted-foreground line-clamp-3 text-sm leading-relaxed">
            {course.description}
          </p>

          {/* Stats row */}
          <div className="mt-auto flex items-center gap-4 text-xs">
            <StatItem icon={BookOpen} value={course.lessonCount} label={t('lessons')} />
            <StatItem icon={Clock} value={course.estimatedHours} label={t('hours')} />
            <StatItem icon={Sparkles} value={course.totalXp} label={t('xp')} />
          </div>

          {/* Progress bar (only if enrolled and not finalized) */}
          {isEnrolled && !isCompleted && (
            <div className="flex flex-col gap-1.5">
              <Progress value={enrollment.progressPercent} className="h-1.5" />
              <span className="text-muted-foreground text-xs">
                {t('progress', { percent: Math.round(enrollment.progressPercent) })}
              </span>
            </div>
          )}

          {/* CTA Button */}
          <Button
            variant={isEnrolled ? 'default' : 'outline'}
            size="sm"
            className={cn(
              'mt-1 w-full gap-1.5 transition-colors',
              isCompleted && 'bg-emerald-600 hover:bg-emerald-700 text-white',
            )}
            tabIndex={-1}
          >
            {isCompleted ? (
              <>
                <CheckCircle2 className="size-3.5" />
                {t('completed')}
              </>
            ) : isEnrolled ? (
              <>
                {t('continue')}
                <ArrowRight className="size-3.5" />
              </>
            ) : (
              t('start')
            )}
          </Button>
        </CardContent>
      </Card>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Internal
// ---------------------------------------------------------------------------

function StatItem({
  icon: Icon,
  value,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>;
  value: number;
  label: string;
}) {
  return (
    <div className="text-muted-foreground flex items-center gap-1">
      <Icon className="size-3.5" />
      <span className="font-medium tabular-nums">{value}</span>
      <span>{label}</span>
    </div>
  );
}
