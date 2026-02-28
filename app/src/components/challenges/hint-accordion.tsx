'use client';

import { useCallback, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Lightbulb, Lock, Eye, AlertTriangle } from 'lucide-react';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface HintAccordionProps {
  hints: string[];
  className?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function HintAccordion({ hints, className }: HintAccordionProps) {
  const t = useTranslations('challenge');
  const [revealedHints, setRevealedHints] = useState<Set<number>>(new Set());
  const [confirmingIndex, setConfirmingIndex] = useState<number | null>(null);

  const revealedCount = revealedHints.size;
  const totalCount = hints.length;

  const handleReveal = useCallback((index: number) => {
    setRevealedHints((prev) => {
      const next = new Set(prev);
      next.add(index);
      return next;
    });
    setConfirmingIndex(null);
  }, []);

  const handleRequestReveal = useCallback((index: number) => {
    // If already revealed, no confirmation needed
    if (revealedHints.has(index)) return;
    setConfirmingIndex(index);
  }, [revealedHints]);

  const handleCancelReveal = useCallback(() => {
    setConfirmingIndex(null);
  }, []);

  if (hints.length === 0) return null;

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Lightbulb className="size-4 text-amber-500" />
          <h3 className="text-sm font-semibold">{t('hints')}</h3>
        </div>
        <Badge variant="secondary" className="text-xs">
          {t('hints_used', { used: revealedCount, total: totalCount })}
        </Badge>
      </div>

      {/* Accordion */}
      <Accordion type="single" collapsible>
        {hints.map((hint, index) => {
          const isRevealed = revealedHints.has(index);
          const isConfirming = confirmingIndex === index;

          return (
            <AccordionItem key={index} value={`hint-${index}`}>
              <AccordionTrigger
                onClick={(e) => {
                  if (!isRevealed) {
                    e.preventDefault();
                    handleRequestReveal(index);
                  }
                }}
                className={cn(
                  'gap-3 text-sm',
                  !isRevealed && 'text-muted-foreground',
                )}
              >
                <div className="flex items-center gap-2">
                  {isRevealed ? (
                    <Eye className="size-3.5 text-amber-500" />
                  ) : (
                    <Lock className="size-3.5" />
                  )}
                  {t('hint_number', { number: index + 1 })}
                </div>
              </AccordionTrigger>

              {isRevealed ? (
                <AccordionContent>
                  <p className="text-sm leading-relaxed text-foreground/80">
                    {hint}
                  </p>
                </AccordionContent>
              ) : isConfirming ? (
                <div className="animate-in fade-in slide-in-from-top-1 flex flex-col gap-3 rounded-lg border border-amber-500/30 bg-amber-50 p-4 dark:bg-amber-900/10">
                  <div className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-400">
                    <AlertTriangle className="size-4" />
                    <span className="font-medium">{t('hint_warning')}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCancelReveal}
                      className="text-xs"
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleReveal(index)}
                      className="gap-1 text-xs"
                    >
                      <Eye className="size-3" />
                      {t('hint_confirm')}
                    </Button>
                  </div>
                </div>
              ) : null}
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}
