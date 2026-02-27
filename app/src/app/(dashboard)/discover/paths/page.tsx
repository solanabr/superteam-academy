'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/hooks';
import { Loader2, ArrowRight, Route, BookOpen, Clock, CheckCircle2 } from 'lucide-react';

interface LearningPath {
  id: string;
  slug: string;
  title: string;
  description: string;
  courses: number;
  duration: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  lessonsCount: number;
}

interface DiscoverCourse {
  id: string;
  slug: string;
  title: string;
  enrolled: boolean;
}

const difficultyColors = {
  beginner: 'bg-green-500/10 text-green-500 border-green-500/20',
  intermediate: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  advanced: 'bg-red-500/10 text-red-500 border-red-500/20',
};

export default function LearningPathsPage() {
  const { t } = useTranslation();
  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrollingPathSlug, setEnrollingPathSlug] = useState<string | null>(null);
  const [enrolledPathSlug, setEnrolledPathSlug] = useState<string | null>(null);

  useEffect(() => {
    const fetchPaths = async () => {
      try {
        const response = await fetch('/api/landing', { cache: 'no-store' });
        if (!response.ok) throw new Error('Failed to fetch learning paths');

        const data = await response.json();
        setPaths((data.learningPaths || []) as LearningPath[]);
      } catch (error) {
        console.error('Error loading learning paths:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPaths();
  }, []);

  const hasPaths = useMemo(() => paths.length > 0, [paths]);

  const handleEnrollPath = async (pathSlug: string) => {
    setEnrollingPathSlug(pathSlug);
    try {
      const coursesResponse = await fetch(`/api/discover/courses?track=${encodeURIComponent(pathSlug)}`, {
        cache: 'no-store',
      });

      if (!coursesResponse.ok) throw new Error('Failed to load path courses');

      const coursesData = await coursesResponse.json();
      const courses: DiscoverCourse[] = coursesData.courses || [];
      const coursesToEnroll = courses.filter((course) => !course.enrolled);

      await Promise.all(
        coursesToEnroll.map((course) =>
          fetch('/api/discover/enroll', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ courseSlug: course.slug }),
          })
        )
      );

      setEnrolledPathSlug(pathSlug);
      setTimeout(() => setEnrolledPathSlug(null), 2500);
    } catch (error) {
      console.error('Error enrolling path:', error);
    } finally {
      setEnrollingPathSlug(null);
    }
  };

  return (
    <div className="container space-y-8 py-8">
      <div>
        <h1 className="text-3xl font-bold">{t('learningPaths.title')}</h1>
        <p className="text-muted-foreground mt-2">
          {t('learningPaths.subtitle')}
        </p>
      </div>

      {loading ? (
        <div className="py-12 text-center">
          <Loader2 className="text-muted-foreground mx-auto h-8 w-8 animate-spin" />
          <p className="text-muted-foreground mt-4">{t('learningPaths.loading')}</p>
        </div>
      ) : hasPaths ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {paths.map((path) => {
            const isEnrolling = enrollingPathSlug === path.slug;
            const isEnrolled = enrolledPathSlug === path.slug;

            return (
              <Card key={path.id} className="h-full">
                <CardHeader>
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <Badge variant="outline" className={`capitalize ${difficultyColors[path.difficulty]}`}>
                      {t(`courses.filters.${path.difficulty}`)}
                    </Badge>
                    <Route className="text-muted-foreground h-4 w-4" />
                  </div>
                  <CardTitle>{path.title}</CardTitle>
                  <CardDescription>{path.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-muted-foreground flex items-center justify-between text-sm">
                    <span className="inline-flex items-center gap-1">
                      <BookOpen className="h-4 w-4" />
                      {path.courses} {t('nav.courses').toLowerCase()}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {path.duration}
                    </span>
                  </div>

                  <p className="text-muted-foreground text-xs">
                    {path.lessonsCount} {t('learningPaths.totalLessons')}
                  </p>

                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <Button variant="outline" asChild>
                      <Link href={`/discover/paths/${path.slug}`}>
                        {t('learningPaths.viewDetails')}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                    <Button onClick={() => handleEnrollPath(path.slug)} disabled={isEnrolling}>
                      {isEnrolling ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {t('learningPaths.enrolling')}
                        </>
                      ) : isEnrolled ? (
                        <>
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          {t('learningPaths.enrolled')}
                        </>
                      ) : (
                        t('learningPaths.enrollPath')
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">{t('learningPaths.noPaths')}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
