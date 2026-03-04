'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { getCourseService, getProgressService } from '@/lib/services';
import { Course, Lesson } from '@/lib/types/domain';
import { LessonView } from '@/components/lesson/LessonView';

export default function LessonPage() {
  const params = useParams();
  const router = useRouter();
  const { connected, publicKey } = useWallet();
  const [course, setCourse] = useState<Course | null>(null);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLesson() {
      try {
        const courseService = getCourseService();
        const loadedCourse = await courseService.getCourseBySlug(params.slug as string);
        if (!loadedCourse) {
          router.push('/courses');
          return;
        }
        setCourse(loadedCourse);

        const foundLesson = loadedCourse.modules
          .flatMap((m: any) => m.lessons)
          .find((l: any) => l.id === params.lessonId);

        if (!foundLesson) {
          router.push(`/courses/${params.slug}`);
          return;
        }
        setLesson(foundLesson);

        if (connected && publicKey) {
          const progressService = getProgressService();
          const progress = await progressService.getProgress(publicKey.toBase58(), loadedCourse.id);
          if (progress) {
            setIsCompleted((progress as any).completedLessonIds.includes(foundLesson.id));
          }
        }
      } finally {
        setLoading(false);
      }
    }
    loadLesson();
  }, [params.slug, params.lessonId, connected, publicKey, router]);

  if (loading) {
    return (
      <div className="container flex min-h-[600px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!course || !lesson) {
    return null;
  }

  return (
    <div className="container py-8">
      <Link href={`/courses/${params.slug}`}>
        <Button variant="ghost" className="mb-6 gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to {course.title}
        </Button>
      </Link>

      <LessonView
        lesson={lesson as any}
        {...({ courseId: course.id } as any)}
        isCompleted={isCompleted}
        onComplete={async () => { setIsCompleted(true) }}
      />
    </div>
  );
}