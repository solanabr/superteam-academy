'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface LessonCompleteAnimationProps {
  xp: number;
  onComplete?: () => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Total animation duration before calling onComplete */
const TOTAL_DURATION_MS = 1800;

/** SVG circle circumference (2 * PI * 45 radius) */
const CIRCLE_CIRCUMFERENCE = 283;

/** SVG checkmark path length (approximate) */
const CHECK_PATH_LENGTH = 50;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Animated checkmark with circle draw + floating XP text.
 * Pure SVG + CSS keyframe animations, no external dependencies.
 *
 * Animation sequence:
 * 1. Circle draws itself (0-0.8s)
 * 2. Checkmark draws inside (0.6-1.0s)
 * 3. "+XP" text floats up and fades (0.8-1.8s)
 */
export function LessonCompleteAnimation({ xp, onComplete }: LessonCompleteAnimationProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onComplete?.();
    }, TOTAL_DURATION_MS);

    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!visible) return null;

  return (
    <div
      className="relative inline-flex flex-col items-center"
      role="status"
      aria-label={`Lesson complete! +${xp} XP earned`}
    >
      {/* SVG Circle + Checkmark */}
      <svg
        className="size-16"
        viewBox="0 0 100 100"
        fill="none"
        aria-hidden="true"
      >
        {/* Background circle (faint) */}
        <circle
          cx="50"
          cy="50"
          r="45"
          stroke="currentColor"
          strokeWidth="3"
          className="text-emerald-200 dark:text-emerald-900"
        />

        {/* Animated circle */}
        <circle
          cx="50"
          cy="50"
          r="45"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          className={cn(
            'text-emerald-500 dark:text-emerald-400',
            'animate-draw-circle',
          )}
          style={{
            strokeDasharray: CIRCLE_CIRCUMFERENCE,
            strokeDashoffset: CIRCLE_CIRCUMFERENCE,
            transformOrigin: 'center',
            transform: 'rotate(-90deg)',
          }}
        />

        {/* Animated checkmark */}
        <path
          d="M30 52 L44 66 L70 38"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={cn(
            'text-emerald-500 dark:text-emerald-400',
            'animate-draw-check',
          )}
          style={{
            strokeDasharray: CHECK_PATH_LENGTH,
            strokeDashoffset: CHECK_PATH_LENGTH,
          }}
        />
      </svg>

      {/* Floating XP text */}
      <span
        className={cn(
          'absolute -top-1 left-1/2 -translate-x-1/2 text-sm font-bold tabular-nums text-emerald-600 dark:text-emerald-400',
          'animate-float-up-fade',
        )}
        style={{ opacity: 0 }}
        aria-hidden="true"
      >
        +{xp} XP
      </span>
    </div>
  );
}
