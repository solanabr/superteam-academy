'use client';

import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { LessonContent } from '@/components/lessons/lesson-content';
import { ChallengeRunner } from '@/components/lessons/challenge-runner';
import { VideoPlayer } from '@/components/lessons/video-player';
import { Quiz } from '@/components/lessons/quiz';
import { Discussion } from '@/components/lessons/discussion';
import { LessonNav } from '@/components/lessons/lesson-nav';
import {
  ArrowLeft,
  BookOpen,
  FileText,
  Video,
  Code2,
  HelpCircle,
  CheckCircle2,
  Circle,
} from 'lucide-react';
import {
  findLessonById,
  getDiscussionForLesson,
  type LessonType,
} from '@/lib/mock-data';
import { useState, useCallback } from 'react';

const lessonTypeIcons: Record<LessonType, typeof FileText> = {
  text: FileText,
  video: Video,
  challenge: Code2,
  quiz: HelpCircle,
};

export default function LessonPage() {
  const t = useTranslations('lessonView');
  const params = useParams();
  const slug = params.slug as string;
  const lessonId = params.id as string;

  const result = findLessonById(lessonId);
  const [showModules, setShowModules] = useState(false);

  const handleComplete = useCallback(() => {
    // In a real app, this would save to backend
  }, []);

  if (!result) {
    return (
      <div className="container flex flex-col items-center justify-center gap-4 py-20">
        <h1 className="text-2xl font-bold">{t('notFound')}</h1>
        <Link href={`/courses/${slug}`}>
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            {t('backToCourse')}
          </Button>
        </Link>
      </div>
    );
  }

  const { course, module: currentModule, lesson, lessonIndex, totalLessons, allLessons } = result;
  const comments = getDiscussionForLesson(lessonId);
  const completedCount = allLessons.filter((l) => l.completed).length;
  const progressPercent = Math.round((completedCount / totalLessons) * 100);

  return (
    <div className="flex min-h-screen flex-col">
      {/* Top Bar */}
      <div className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
        <div className="container flex items-center justify-between py-3">
          <div className="flex items-center gap-3">
            <Link href={`/courses/${slug}`}>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="hidden sm:block">
              <p className="text-sm font-medium">{course.title}</p>
              <p className="text-xs text-muted-foreground">{currentModule.title}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-xs text-muted-foreground">
              {t('lessonProgress', {
                current: lessonIndex + 1,
                total: totalLessons,
              })}
            </span>
            <Progress value={progressPercent} className="hidden w-32 sm:block" />
            <Button
              variant="outline"
              size="sm"
              className="gap-1 text-xs"
              onClick={() => setShowModules(!showModules)}
            >
              <BookOpen className="h-3 w-3" />
              {t('modules')}
            </Button>
          </div>
        </div>
      </div>

      <div className="container flex flex-1 gap-0">
        {/* Module Sidebar (toggleable) */}
        {showModules && (
          <aside className="hidden w-72 shrink-0 border-r border-border py-6 pr-4 lg:block">
            <h3 className="mb-4 text-sm font-semibold">{t('courseContent')}</h3>
            {course.modules.map((mod) => (
              <div key={mod.id} className="mb-4">
                <p className="mb-2 text-xs font-medium text-muted-foreground uppercase">
                  {mod.title}
                </p>
                {mod.lessons.map((l) => {
                  const Icon = lessonTypeIcons[l.type];
                  const isActive = l.id === lessonId;
                  return (
                    <Link
                      key={l.id}
                      href={`/courses/${slug}/lessons/${l.id}`}
                      className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors ${
                        isActive
                          ? 'bg-primary/10 text-primary font-medium'
                          : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                      }`}
                    >
                      {l.completed ? (
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-green-500" />
                      ) : (
                        <Circle className="h-3.5 w-3.5 shrink-0" />
                      )}
                      <Icon className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{l.title}</span>
                    </Link>
                  );
                })}
              </div>
            ))}
          </aside>
        )}

        {/* Main Content */}
        <div className="flex-1 py-6 px-0 lg:px-8">
          {/* Lesson Header */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary" className="text-xs capitalize">
                {lesson.type}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {lesson.duration} min
              </span>
              {lesson.completed && (
                <Badge className="bg-green-500/10 text-green-500 border-green-500/20 text-xs">
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                  {t('completed')}
                </Badge>
              )}
            </div>
            <h1 className="text-2xl font-bold">{lesson.title}</h1>
          </div>

          <Separator className="mb-6" />

          {/* Lesson Content by Type */}
          {lesson.type === 'text' && lesson.content && (
            <div className="mb-8">
              <LessonContent content={lesson.content} />
            </div>
          )}

          {lesson.type === 'text' && !lesson.content && (
            <div className="mb-8 rounded-lg border border-border bg-accent/20 p-8 text-center">
              <FileText className="mx-auto mb-3 h-12 w-12 text-muted-foreground/50" />
              <p className="text-muted-foreground">{t('contentComingSoon')}</p>
            </div>
          )}

          {lesson.type === 'video' && lesson.videoUrl && (
            <div className="mb-8">
              <VideoPlayer videoUrl={lesson.videoUrl} onComplete={handleComplete} />
            </div>
          )}

          {lesson.type === 'video' && !lesson.videoUrl && (
            <div className="mb-8 rounded-lg border border-border bg-accent/20 p-8 text-center">
              <Video className="mx-auto mb-3 h-12 w-12 text-muted-foreground/50" />
              <p className="text-muted-foreground">{t('contentComingSoon')}</p>
            </div>
          )}

          {lesson.type === 'challenge' && lesson.challenge && (
            <div className="mb-8">
              <ChallengeRunner
                challenge={lesson.challenge}
                onComplete={handleComplete}
              />
            </div>
          )}

          {lesson.type === 'challenge' && !lesson.challenge && (
            <div className="mb-8 rounded-lg border border-border bg-accent/20 p-8 text-center">
              <Code2 className="mx-auto mb-3 h-12 w-12 text-muted-foreground/50" />
              <p className="text-muted-foreground">{t('contentComingSoon')}</p>
            </div>
          )}

          {lesson.type === 'quiz' && lesson.quiz && (
            <div className="mb-8">
              <Quiz quiz={lesson.quiz} onComplete={handleComplete} />
            </div>
          )}

          {lesson.type === 'quiz' && !lesson.quiz && (
            <div className="mb-8 rounded-lg border border-border bg-accent/20 p-8 text-center">
              <HelpCircle className="mx-auto mb-3 h-12 w-12 text-muted-foreground/50" />
              <p className="text-muted-foreground">{t('contentComingSoon')}</p>
            </div>
          )}

          {/* Navigation */}
          <LessonNav
            courseSlug={slug}
            allLessons={allLessons}
            currentIndex={lessonIndex}
          />

          {/* Discussion */}
          <div className="mt-8">
            <Discussion comments={comments} />
          </div>
        </div>
      </div>
    </div>
  );
}
