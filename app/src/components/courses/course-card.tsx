'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { DIFFICULTY_LABELS, TRACK_LABELS } from '@/lib/solana/constants';
import { getDifficultyColor, formatXp } from '@/lib/utils';
import type { Course, LessonProgress } from '@/types';
import { BookOpen, Users, Sparkles, Lock } from 'lucide-react';

interface Props {
  course: Course;
  progress?: LessonProgress | null;
  isEnrolled?: boolean;
}

export function CourseCard({ course, progress, isEnrolled }: Props) {
  const t = useTranslations('courses');

  const totalXp = course.xpPerLesson * course.lessonCount;
  const bonusXp = Math.floor(totalXp / 2);
  const difficultyClass = getDifficultyColor(course.difficulty);

  return (
    <Card className="group hover:border-solana-purple/50 transition-all duration-200 hover:shadow-lg hover:shadow-solana-purple/5 flex flex-col">
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex gap-2 flex-wrap">
            <Badge variant="outline" className={difficultyClass}>
              {DIFFICULTY_LABELS[course.difficulty]}
            </Badge>
            {course.trackId > 0 && (
              <Badge variant="secondary">
                {TRACK_LABELS[course.trackId] || `Track ${course.trackId}`}
              </Badge>
            )}
          </div>
          {course.prerequisite && (
            <Lock className="h-4 w-4 text-muted-foreground" />
          )}
        </div>

        <CardTitle className="text-lg leading-tight group-hover:text-solana-purple transition-colors">
          {course.title || course.courseId}
        </CardTitle>

        {course.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {course.description}
          </p>
        )}
      </CardHeader>

      <CardContent className="flex-1 space-y-3">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <BookOpen className="h-3.5 w-3.5" />
            {course.lessonCount} {t('lessons')}
          </span>
          <span className="flex items-center gap-1">
            <Sparkles className="h-3.5 w-3.5 text-xp-gold" />
            {formatXp(totalXp + bonusXp)} XP
          </span>
          <span className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            {course.totalCompletions}
          </span>
        </div>

        {progress && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span>{t('progress', { percent: Math.round(progress.progressPercent) })}</span>
            </div>
            <Progress value={progress.progressPercent} className="h-1.5" />
          </div>
        )}
      </CardContent>

      <CardFooter>
        <Link href={`/courses/${course.courseId}`} className="w-full">
          <Button
            className="w-full"
            variant={isEnrolled ? 'outline' : 'solana'}
          >
            {progress?.completedAt
              ? t('completed')
              : isEnrolled
                ? t('continue')
                : t('enroll')}
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
