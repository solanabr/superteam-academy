'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import type { Lesson } from '@/lib/mock-data';

interface LessonNavProps {
  courseSlug: string;
  allLessons: Lesson[];
  currentIndex: number;
}

export function LessonNav({ courseSlug, allLessons, currentIndex }: LessonNavProps) {
  const t = useTranslations('lessonView');
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson =
    currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

  return (
    <div className="flex items-center justify-between border-t border-border pt-6">
      {prevLesson ? (
        <Link href={`/courses/${courseSlug}/lessons/${prevLesson.id}`}>
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            {t('previousLesson')}
          </Button>
        </Link>
      ) : (
        <div />
      )}
      {nextLesson ? (
        <Link href={`/courses/${courseSlug}/lessons/${nextLesson.id}`}>
          <Button variant="solana" className="gap-2">
            {t('nextLesson')}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      ) : (
        <Link href={`/courses/${courseSlug}`}>
          <Button variant="solana" className="gap-2">
            {t('backToCourse')}
          </Button>
        </Link>
      )}
    </div>
  );
}
