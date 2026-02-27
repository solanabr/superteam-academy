'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/hooks';
import { Loader2, ArrowLeft, ArrowRight, BookOpen, CheckCircle2 } from 'lucide-react';

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

interface PathCourse {
  id: string;
  slug: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number;
  lessonsCount: number;
  enrolled: boolean;
  enrollmentProgress?: number;
}

const difficultyColors = {
  beginner: 'bg-green-500/10 text-green-500 border-green-500/20',
  intermediate: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  advanced: 'bg-red-500/10 text-red-500 border-red-500/20',
};

export default function LearningPathDetailPage() {
  const { t } = useTranslation();
  const params = useParams();
  const slug = params.slug as string;

  const [path, setPath] = useState<LearningPath | null>(null);
  const [courses, setCourses] = useState<PathCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrollingAll, setEnrollingAll] = useState(false);

  useEffect(() => {
    const fetchPathData = async () => {
      try {
        const [landingRes, coursesRes] = await Promise.all([
          fetch('/api/landing', { cache: 'no-store' }),
          fetch(`/api/discover/courses?track=${encodeURIComponent(slug)}`, { cache: 'no-store' }),
        ]);

        if (!landingRes.ok || !coursesRes.ok) throw new Error('Failed to fetch learning path data');

        const landingData = await landingRes.json();
        const coursesData = await coursesRes.json();

        const matchedPath = (landingData.learningPaths || []).find((p: LearningPath) => p.slug === slug);
        setPath(matchedPath || null);
        setCourses((coursesData.courses || []) as PathCourse[]);
      } catch (error) {
        console.error('Error loading learning path detail:', error);
        setPath(null);
        setCourses([]);
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchPathData();
    }
  }, [slug]);

  const unenrolledCourses = useMemo(() => courses.filter((course) => !course.enrolled), [courses]);

  const handleEnrollAll = async () => {
    setEnrollingAll(true);
    try {
      await Promise.all(
        unenrolledCourses.map((course) =>
          fetch('/api/discover/enroll', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ courseSlug: course.slug }),
          })
        )
      );

      setCourses((prev) =>
        prev.map((course) => ({
          ...course,
          enrolled: true,
          enrollmentProgress: course.enrollmentProgress || 0,
        }))
      );
    } catch (error) {
      console.error('Error enrolling all courses in path:', error);
    } finally {
      setEnrollingAll(false);
    }
  };

  if (loading) {
    return (
      <div className="container py-12 text-center">
        <Loader2 className="text-muted-foreground mx-auto h-8 w-8 animate-spin" />
        <p className="text-muted-foreground mt-4">{t('learningPaths.loadingPath')}</p>
      </div>
    );
  }

  if (!path) {
    return (
      <div className="container py-8">
        <Button variant="outline" asChild className="mb-6">
          <Link href="/discover/paths">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('learningPaths.backToPaths')}
          </Link>
        </Button>
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-muted-foreground">{t('learningPaths.pathNotFound')}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container space-y-8 py-8">
      <div className="flex items-center justify-between gap-4">
        <Button variant="outline" asChild>
          <Link href="/discover/paths">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('learningPaths.backToPaths')}
          </Link>
        </Button>

        <Button onClick={handleEnrollAll} disabled={enrollingAll || unenrolledCourses.length === 0}>
          {enrollingAll ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t('learningPaths.enrollingPath')}
            </>
          ) : unenrolledCourses.length === 0 ? (
            <>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              {t('learningPaths.pathEnrolled')}
            </>
          ) : (
            t('learningPaths.enrollCompletePath')
          )}
        </Button>
      </div>

      <div>
        <div className="mb-3 flex items-center gap-2">
          <Badge variant="outline" className={`capitalize ${difficultyColors[path.difficulty]}`}>
            {t(`courses.filters.${path.difficulty}`)}
          </Badge>
          <Badge variant="secondary">
            {path.courses} {t('nav.courses').toLowerCase()}
          </Badge>
          <Badge variant="secondary">{path.duration}</Badge>
        </div>
        <h1 className="text-3xl font-bold">{path.title}</h1>
        <p className="text-muted-foreground mt-2">{path.description}</p>
      </div>

      <div className="space-y-4">
        {courses.map((course) => (
          <Card key={course.slug}>
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <CardTitle className="text-lg">{course.title}</CardTitle>
                  <CardDescription>{course.description}</CardDescription>
                </div>
                {course.enrolled ? (
                  <Badge className="bg-green-500 text-white">
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    {t('learningPaths.enrolledStatus')}
                  </Badge>
                ) : (
                  <Badge variant="outline">{t('learningPaths.notEnrolled')}</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <div className="text-muted-foreground flex items-center gap-4 text-sm">
                <span className="inline-flex items-center gap-1">
                  <BookOpen className="h-4 w-4" />
                  {course.lessonsCount || 0} {t('courses.card.lessons')}
                </span>
                <span>
                  {course.duration || 0} {t('courses.card.duration')}
                </span>
              </div>

              <Button variant="outline" asChild>
                <Link href={`/discover?enroll=${course.slug}`}>
                  {t('learningPaths.viewCourse')}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
