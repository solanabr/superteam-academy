'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, BookOpen, Trophy, Loader2, Clock } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { getCourseService, getProgressService } from '@/lib/services';
import { Course } from '@/lib/types/domain';
import { getDifficultyVariant, formatDuration } from '@/lib/utils';

export default function CourseDetailPage() {
  const params = useParams();
  const { connected, publicKey } = useWallet();
  const [course, setCourse] = useState<Course | null>(null);
  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCourse() {
      try {
        const courseService = getCourseService();
        const loadedCourse = await courseService.getCourseBySlug(params.slug as string);
        setCourse(loadedCourse);

        if (connected && publicKey && loadedCourse) {
          const progressService = getProgressService();
          const progress = await progressService.getProgress(publicKey.toBase58(), loadedCourse.id);
          if (progress) {
            setCompletedLessonIds((progress as any).completedLessonIds);
          }
        }
      } finally {
        setLoading(false);
      }
    }
    loadCourse();
  }, [params.slug, connected, publicKey]);

  if (loading) {
    return (
      <div className="container flex min-h-[600px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="container py-8">
        <Card>
          <CardHeader>
            <CardTitle>Course not found</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const totalLessons = course.modules.reduce((acc, m) => acc + m.lessons.length, 0);
  const completedLessons = completedLessonIds.length;
  const progressPercentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  return (
    <div className="container py-8 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3 mb-4">
            <Badge variant={getDifficultyVariant(course.difficulty) as any}>{course.difficulty}</Badge>
            <span className="flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              {formatDuration(course.durationMinutes)}
            </span>
            <span className="flex items-center gap-1 text-sm text-muted-foreground">
              <Trophy className="h-4 w-4 text-yellow-500" />
              {course.xpReward} XP
            </span>
          </div>
          <CardTitle className="text-3xl">{course.title}</CardTitle>
          <p className="text-muted-foreground">{course.description}</p>
        </CardHeader>
        {connected && (
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Your Progress</span>
                <span className="text-muted-foreground">{completedLessons} / {totalLessons} lessons</span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-primary transition-all" style={{ width: `${progressPercentage}%` }} />
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      <div className="space-y-6">
        {course.modules.map((module, moduleIndex) => (
          <Card key={module.id}>
            <CardHeader>
              <CardTitle>Module {moduleIndex + 1}: {module.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {module.lessons.map((lesson, lessonIndex) => {
                  const isCompleted = completedLessonIds.includes(lesson.id);
                  return (
                    <Link key={lesson.id} href={`/courses/${params.slug}/lessons/${lesson.id}`}>
                      <div className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent transition-colors cursor-pointer">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-sm font-medium">
                            {lessonIndex + 1}
                          </div>
                          <div>
                            <div className="font-medium flex items-center gap-2">
                              {lesson.title}
                              {isCompleted && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                            </div>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                              <Badge variant="outline" className="text-xs">{lesson.type}</Badge>
                              <span className="flex items-center gap-1">
                                <Trophy className="h-3 w-3" />
                                {lesson.xpReward} XP
                              </span>
                            </div>
                          </div>
                        </div>
                        {isCompleted ? (
                          <Badge variant="success" className="gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            Done
                          </Badge>
                        ) : (
                          <Button variant="ghost" size="sm">Start</Button>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}