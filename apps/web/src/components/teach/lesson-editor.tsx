'use client';

import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import type { Lesson } from '@/lib/mock-data';

interface LessonEditorProps {
  lesson: Lesson;
}

const typeIcons: Record<string, string> = {
  text: '📖',
  video: '🎬',
  challenge: '💻',
  quiz: '❓',
};

export function LessonEditor({ lesson }: LessonEditorProps) {
  const t = useTranslations('teach');

  return (
    <div className="mb-2 flex items-center gap-2 rounded-lg border p-3">
      <span>{typeIcons[lesson.type] ?? '📄'}</span>
      <span className="flex-1 text-sm">{lesson.title || t('untitledLesson')}</span>
      <Badge variant="outline" className="text-xs">
        {lesson.type}
      </Badge>
      <span className="text-xs text-muted-foreground">{lesson.duration}min</span>
    </div>
  );
}
