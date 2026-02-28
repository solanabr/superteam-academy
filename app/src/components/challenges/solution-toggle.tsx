'use client';

import { useCallback, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Eye, AlertTriangle, Code2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SolutionToggleProps {
  solutionCode: string;
  language?: string;
  className?: string;
}

// ---------------------------------------------------------------------------
// Code display subcomponent (read-only, syntax-highlighted)
// ---------------------------------------------------------------------------

function SolutionCodeBlock({ code, language }: { code: string; language: string }) {
  const lines = code.split('\n');

  return (
    <div className="overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-700">
      <div className="flex items-center justify-between border-b border-neutral-200 bg-neutral-50 px-4 py-2 dark:border-neutral-700 dark:bg-neutral-800">
        <span className="text-xs font-medium text-muted-foreground">
          {language}
        </span>
        <span className="text-xs text-muted-foreground/60">read-only</span>
      </div>

      <div className="overflow-x-auto bg-[#1e1e1e] p-4">
        <pre className="font-mono text-sm leading-relaxed">
          {lines.map((line, i) => (
            <div key={i} className="flex">
              <span className="mr-4 inline-block w-8 select-none text-right text-neutral-600">
                {i + 1}
              </span>
              <code className="text-[#d4d4d4]">{line || '\u00A0'}</code>
            </div>
          ))}
        </pre>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SolutionToggle({
  solutionCode,
  language = 'rust',
  className,
}: SolutionToggleProps) {
  const t = useTranslations('lesson');
  const tc = useTranslations('common');
  const [revealed, setRevealed] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleConfirmReveal = useCallback(() => {
    setRevealed(true);
    setDialogOpen(false);
  }, []);

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {revealed ? (
        <>
          {/* Header */}
          <div className="flex items-center gap-2">
            <Code2 className="size-4 text-primary" />
            <h3 className="text-sm font-semibold">{t('solution')}</h3>
          </div>

          {/* Solution code */}
          <SolutionCodeBlock code={solutionCode} language={language} />
        </>
      ) : (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="w-fit gap-2"
            >
              <Eye className="size-4" />
              {t('show_solution')}
            </Button>
          </DialogTrigger>

          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="size-5 text-amber-500" />
                {t('show_solution')}
              </DialogTitle>
              <DialogDescription>
                {t('solution_warning')}
              </DialogDescription>
            </DialogHeader>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                {tc('cancel')}
              </Button>
              <Button
                onClick={handleConfirmReveal}
                className="gap-1"
              >
                <Eye className="size-4" />
                {t('show_solution')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
