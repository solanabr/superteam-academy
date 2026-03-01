'use client';

import { useTranslations } from 'next-intl';
import {
  BookOpen,
  Clock,
  Sparkles,
  Users,
  Copy,
  CheckCheck,
} from 'lucide-react';
import { useState, useCallback } from 'react';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';
import { DifficultyBadge } from '@/components/courses/difficulty-badge';
import { TrackBadge } from '@/components/courses/track-badge';
import { cn } from '@/lib/utils';
import type { CourseWithMeta } from '@/lib/stores/course-store';

// ---------------------------------------------------------------------------
// Track gradient map (shared with course-card.tsx pattern)
// ---------------------------------------------------------------------------

const TRACK_GRADIENTS: Record<number, string> = {
  1: 'from-purple-600 via-violet-600 to-indigo-700',
  2: 'from-blue-600 via-cyan-600 to-teal-600',
  3: 'from-pink-600 via-rose-500 to-orange-500',
  4: 'from-orange-600 via-amber-600 to-yellow-600',
};

const DEFAULT_GRADIENT = 'from-primary via-primary/80 to-accent';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CourseHeaderProps {
  course: CourseWithMeta;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CourseHeader({ course }: CourseHeaderProps) {
  const t = useTranslations('courses');
  const gradient = TRACK_GRADIENTS[course.trackId] ?? DEFAULT_GRADIENT;

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl bg-gradient-to-br p-6 text-white sm:p-8 lg:p-10',
        gradient,
      )}
    >
      {/* Decorative pattern overlay */}
      <div className="pointer-events-none absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImEiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNhKSIvPjwvc3ZnPg==')] opacity-60" />

      <div className="relative flex flex-col gap-4">
        {/* Badges */}
        <div className="flex flex-wrap items-center gap-2">
          <TrackBadge
            trackId={course.trackId}
            trackSlug={course.trackSlug}
            className="bg-white/15 text-white backdrop-blur-sm [&_svg]:text-white border-white/20"
          />
          <DifficultyBadge
            difficulty={course.difficulty}
            className="bg-white/15 text-white backdrop-blur-sm border-white/20"
          />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
          {course.title}
        </h1>

        {/* Description */}
        <p className="max-w-2xl text-sm leading-relaxed text-white/80 sm:text-base">
          {course.description}
        </p>

        {/* Stats row */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-2">
          <StatPill icon={BookOpen} value={course.lessonCount} label={t('lessons')} />
          <StatPill icon={Clock} value={course.estimatedHours} label={t('hours')} />
          <StatPill icon={Sparkles} value={course.totalXp} label={t('xp')} />
          <StatPill icon={Users} value={course.enrollmentCount} label={t('enrolled')} />
        </div>

        {/* Creator */}
        {course.creator && (
          <CreatorWallet address={course.creator} />
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Internal components
// ---------------------------------------------------------------------------

function StatPill({
  icon: Icon,
  value,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>;
  value: number;
  label: string;
}) {
  return (
    <div className="flex items-center gap-1.5 text-sm text-white/90">
      <Icon className="size-4 text-white/70" />
      <span className="font-semibold tabular-nums">{value}</span>
      <span className="text-white/60">{label}</span>
    </div>
  );
}

function CreatorWallet({ address }: { address: string }) {
  const [copied, setCopied] = useState(false);
  const t = useTranslations('courses');

  const truncated = `${address.slice(0, 4)}...${address.slice(-4)}`;

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable — non-critical
    }
  }, [address]);

  return (
    <div className="flex items-center gap-2 pt-1 text-xs text-white/60">
      <span>{t('created_by')}</span>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1 rounded-md bg-white/10 px-2 py-0.5 font-mono text-white/80 transition-colors hover:bg-white/20"
          >
            {truncated}
            {copied ? (
              <CheckCheck className="size-3 text-emerald-300" />
            ) : (
              <Copy className="size-3" />
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent>{address}</TooltipContent>
      </Tooltip>
    </div>
  );
}
