'use client';

import { isLessonComplete } from '@/lib/program';
import { useI18n } from '@/i18n';
import { completeLesson } from '@/lib/api';
import { useWallet } from '@solana/wallet-adapter-react';
import { useState } from 'react';
import type { EnrollmentAccount } from '@/types';
import BN from 'bn.js';

interface Props {
  courseId: string;
  lessonCount: number;
  enrollment: EnrollmentAccount | null;
  onComplete?: () => void;
}

export default function LessonList({ courseId, lessonCount, enrollment, onComplete }: Props) {
  const { t } = useI18n();
  const { publicKey } = useWallet();
  const [completing, setCompleting] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleComplete = async (index: number) => {
    if (!publicKey) return;
    setCompleting(index);
    setError(null);
    try {
      await completeLesson(courseId, index, publicKey.toBase58());
      onComplete?.();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setCompleting(null);
    }
  };

  return (
    <div className="space-y-2">
      <h3 className="text-lg font-semibold mb-4">{t('course.lessonProgress')}</h3>
      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3 text-sm text-red-400 mb-4">
          {error}
        </div>
      )}
      {Array.from({ length: lessonCount }, (_, i) => {
        const done = enrollment ? isLessonComplete(enrollment.lessonFlags, i) : false;
        const isCompleting = completing === i;

        return (
          <div
            key={i}
            className={`flex items-center justify-between rounded-xl border p-4 transition-all ${
              done
                ? 'border-brand-600/30 bg-brand-600/5'
                : 'border-surface-800 bg-surface-900 hover:border-surface-800/80'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-medium ${
                  done ? 'bg-brand-600 text-white' : 'bg-surface-800 text-surface-200'
                }`}
              >
                {done ? '✓' : i + 1}
              </div>
              <span className={done ? 'text-surface-50' : 'text-surface-200'}>
                {t('course.lesson')} {i + 1}
              </span>
            </div>

            {enrollment && !done && (
              <button
                onClick={() => handleComplete(i)}
                disabled={isCompleting}
                className="btn-primary !py-2 !px-4 !text-xs"
              >
                {isCompleting ? '...' : t('course.complete')}
              </button>
            )}
            {done && (
              <span className="text-xs text-brand-400">{t('course.alreadyComplete')}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
