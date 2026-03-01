'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AchievementToastProps {
  name: string;
  xpReward: number;
  icon?: string;
  onDismiss?: () => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const AUTO_DISMISS_MS = 5000;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Slide-in toast notification for achievement unlocks.
 * Auto-dismisses after 5 seconds with a depleting progress bar.
 * Pure CSS animations.
 */
export function AchievementToast({ name, xpReward, icon, onDismiss }: AchievementToastProps) {
  const [phase, setPhase] = useState<'entering' | 'visible' | 'exiting' | 'gone'>('entering');
  const onDismissRef = useRef(onDismiss);
  useEffect(() => {
    onDismissRef.current = onDismiss;
  }, [onDismiss]);

  const dismiss = useCallback(() => {
    setPhase((current) => {
      if (current === 'exiting' || current === 'gone') return current;

      // Allow exit animation to finish before removing
      setTimeout(() => {
        setPhase('gone');
        onDismissRef.current?.();
      }, 350);

      return 'exiting';
    });
  }, []);

  useEffect(() => {
    // Transition from entering to visible after mount
    const enterFrame = requestAnimationFrame(() => setPhase('visible'));

    // Auto-dismiss timer (single setup on mount)
    const autoTimer = setTimeout(dismiss, AUTO_DISMISS_MS);

    return () => {
      cancelAnimationFrame(enterFrame);
      clearTimeout(autoTimer);
    };
  }, [dismiss]);

  if (phase === 'gone') return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={`Achievement unlocked: ${name}`}
      className={cn(
        'fixed top-4 right-4 z-[9999] w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border shadow-2xl',
        'border-amber-400/30 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/95 dark:to-yellow-950/95 dark:border-amber-500/20',
        phase === 'entering' && 'animate-slide-in-right',
        phase === 'visible' && 'animate-slide-in-right',
        phase === 'exiting' && 'animate-slide-out-right',
      )}
    >
      {/* Content */}
      <div className="flex items-center gap-3 p-4">
        {/* Icon */}
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 shadow-inner">
          {icon ? (
            <span className="text-lg" role="img" aria-hidden="true">{icon}</span>
          ) : (
            <Trophy className="size-5 text-white" />
          )}
        </div>

        {/* Text */}
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-600/70 dark:text-amber-400/70">
            Achievement Unlocked
          </p>
          <p className="truncate text-sm font-bold text-amber-800 dark:text-amber-200">
            {name}
          </p>
          <p className="text-xs tabular-nums text-amber-600 dark:text-amber-400">
            +{xpReward.toLocaleString()} XP
          </p>
        </div>

        {/* Dismiss button */}
        <button
          type="button"
          onClick={dismiss}
          className="shrink-0 rounded-md p-1 text-amber-500/60 transition-colors hover:text-amber-700 dark:hover:text-amber-300"
          aria-label="Dismiss achievement notification"
        >
          <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Depleting progress bar */}
      <div className="h-1 w-full bg-amber-200/30 dark:bg-amber-800/30">
        <div
          className="h-full bg-gradient-to-r from-amber-400 to-yellow-500"
          style={{
            animation: `progress-deplete ${AUTO_DISMISS_MS}ms linear forwards`,
          }}
        />
      </div>
    </div>
  );
}
