'use client';

import { isLessonComplete } from '@/lib/program';
import BN from 'bn.js';

interface Props {
  lessonFlags: BN[];
  lessonCount: number;
  size?: 'sm' | 'md' | 'lg';
}

export default function BitmapProgress({ lessonFlags, lessonCount, size = 'md' }: Props) {
  const cellSize = size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-6 w-6' : 'h-4 w-4';
  const gap = size === 'sm' ? 'gap-0.5' : 'gap-1';

  const completed = Array.from({ length: lessonCount }, (_, i) => isLessonComplete(lessonFlags, i));
  const completedCount = completed.filter(Boolean).length;
  const pct = lessonCount > 0 ? Math.round((completedCount / lessonCount) * 100) : 0;

  return (
    <div className="space-y-2">
      {/* Progress bar */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-surface-200">
          {completedCount}/{lessonCount}
        </span>
        <span className="font-medium text-brand-400">{pct}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-surface-800">
        <div
          className="h-full rounded-full bg-gradient-to-r from-brand-600 to-accent-500 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Bitmap visualization */}
      <div className={`flex flex-wrap ${gap}`}>
        {completed.map((done, i) => (
          <div
            key={i}
            className={`${cellSize} rounded-sm transition-colors ${
              done
                ? 'bg-brand-500 shadow-sm shadow-brand-500/30'
                : 'bg-surface-800 hover:bg-surface-800/80'
            }`}
            title={`Lesson ${i + 1}${done ? ' ✓' : ''}`}
          />
        ))}
      </div>
    </div>
  );
}
