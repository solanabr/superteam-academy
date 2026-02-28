'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ConfettiAnimation } from './confetti-animation';
import { Star, Sparkles, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface LevelUpModalProps {
  level: number;
  levelTitle: string;
  open: boolean;
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * Maps level ranges to perks that unlock at each tier.
 * Keeps UI informative without external data dependencies.
 */
const LEVEL_PERKS: Record<number, string[]> = {
  2: ['Access to community forums', 'Profile badge'],
  3: ['Streak multiplier unlocked', 'Bonus challenges'],
  5: ['Custom profile themes', 'Priority support'],
  7: ['Exclusive workshops', 'Mentorship access'],
  10: ['Contributor badge', 'Beta feature access'],
};

function getPerksForLevel(level: number): string[] {
  const keys = Object.keys(LEVEL_PERKS)
    .map(Number)
    .filter((k) => k <= level)
    .sort((a, b) => b - a);

  return keys.length > 0 ? LEVEL_PERKS[keys[0]!]! : ['New learning paths available'];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Celebration modal displayed when a user reaches a new level.
 * Pure CSS animations -- no external animation libraries.
 */
export function LevelUpModal({ level, levelTitle, open, onClose }: LevelUpModalProps) {
  const [showConfetti, setShowConfetti] = useState(false);
  const [animationReady, setAnimationReady] = useState(false);

  useEffect(() => {
    if (!open) return;

    // Stagger animation start for visual punch
    const readyTimer = requestAnimationFrame(() => setAnimationReady(true));
    const confettiTimer = setTimeout(() => setShowConfetti(true), 200);

    return () => {
      cancelAnimationFrame(readyTimer);
      clearTimeout(confettiTimer);
      // Reset on cleanup (runs when `open` changes to false)
      setShowConfetti(false);
      setAnimationReady(false);
    };
  }, [open]);

  const perks = getPerksForLevel(level);

  return (
    <>
      <ConfettiAnimation trigger={showConfetti} />

      <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
        <DialogContent
          showCloseButton={false}
          className="max-w-sm overflow-hidden border-primary/20 bg-gradient-to-b from-background to-primary/5 text-center dark:from-background dark:to-primary/10"
        >
          <DialogTitle className="sr-only">Level Up!</DialogTitle>

          {/* Top glow decoration */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-20 left-1/2 size-40 -translate-x-1/2 rounded-full bg-primary/20 blur-3xl"
          />

          {/* Level number with scale-bounce */}
          <div className="relative flex flex-col items-center gap-3 pt-4">
            <div
              className={cn(
                'flex size-24 items-center justify-center rounded-full border-4 border-primary/30 bg-primary/10 text-4xl font-extrabold tabular-nums text-primary',
                animationReady && 'animate-scale-bounce',
              )}
            >
              {level}
            </div>

            {/* Title with fade-slide-up */}
            <div
              className={cn(
                'space-y-1 opacity-0',
                animationReady && 'animate-fade-slide-up',
              )}
              style={{ animationDelay: '0.3s' }}
            >
              <p className="text-sm font-medium uppercase tracking-widest text-primary/70">
                Level Up!
              </p>
              <h3 className="text-2xl font-bold text-foreground">
                {levelTitle}
              </h3>
            </div>
          </div>

          {/* Perks unlocked */}
          <div
            className={cn(
              'mt-2 space-y-3 opacity-0',
              animationReady && 'animate-fade-slide-up',
            )}
            style={{ animationDelay: '0.5s' }}
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              New Perks Unlocked
            </p>
            <ul className="space-y-2">
              {perks.map((perk, i) => (
                <li
                  key={perk}
                  className={cn(
                    'flex items-center gap-2 rounded-lg border border-border/50 bg-background/50 px-3 py-2 text-sm text-foreground opacity-0',
                    animationReady && 'animate-fade-slide-up',
                  )}
                  style={{ animationDelay: `${0.6 + i * 0.15}s` }}
                >
                  {i % 3 === 0 ? (
                    <Star className="size-4 shrink-0 text-amber-500" />
                  ) : i % 3 === 1 ? (
                    <Sparkles className="size-4 shrink-0 text-primary" />
                  ) : (
                    <Zap className="size-4 shrink-0 text-emerald-500" />
                  )}
                  {perk}
                </li>
              ))}
            </ul>
          </div>

          {/* Continue button */}
          <div
            className={cn(
              'mt-2 opacity-0',
              animationReady && 'animate-fade-slide-up',
            )}
            style={{ animationDelay: '0.9s' }}
          >
            <Button onClick={onClose} className="w-full" size="lg">
              Continue
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
