import { notFound } from 'next/navigation';
import Link from 'next/link';
import { courseService } from '@/lib/services/course.service';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';

interface LessonPageProps {
  params: Promise<{ courseSlug: string; lessonSlug: string }>;
}

export default async function LessonPage({ params }: LessonPageProps) {
  const { courseSlug, lessonSlug } = await params;
  
  const course = await courseService.getCourseBySlug(courseSlug);
  if (!course) notFound();

  const lesson = await courseService.getLessonBySlug(courseSlug, lessonSlug);
  if (!lesson) notFound();

  const lessons = await courseService.getCourseLessons(course.id);
  const currentIndex = lessons.findIndex(l => l.id === lesson.id);
  const prevLesson = currentIndex > 0 ? lessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < lessons.length - 1 ? lessons[currentIndex + 1] : null;

  return (
    <div className="container py-8">
      {/* Breadcrumb */}
      <div className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/courses" className="hover:text-foreground transition-colors">
          Courses
        </Link>
        <span>/</span>
        <Link 
          href={`/courses/${course.slug}`} 
          className="hover:text-foreground transition-colors"
        >
          {course.title}
        </Link>
        <span>/</span>
        <span className="text-foreground">{lesson.title}</span>
      </div>

      <div className="grid gap-8 lg:grid-cols-4">
        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          <div>
            <div className="mb-4 flex items-center gap-3">
              <Badge className="capitalize">{lesson.lesson_type}</Badge>
              {lesson.xp_reward > 0 && (
                <Badge variant="outline">{lesson.xp_reward} XP</Badge>
              )}
            </div>
            <h1 className="text-3xl font-bold tracking-tight">{lesson.title}</h1>
            <p className="mt-2 text-muted-foreground">{lesson.description}</p>
          </div>

          {/* Lesson Content */}
          <Card>
            <CardContent className="prose prose-neutral dark:prose-invert max-w-none p-8">
              {lesson.lesson_type === 'video' ? (
                <div className="aspect-video rounded-lg bg-muted flex items-center justify-center">
                  <p className="text-muted-foreground">Video player placeholder</p>
                </div>
              ) : lesson.lesson_type === 'coding' ? (
                <div className="rounded-lg border border-border p-8 bg-muted/50">
                  <p className="text-muted-foreground">Interactive code editor placeholder</p>
                </div>
              ) : lesson.lesson_type === 'quiz' ? (
                <div className="rounded-lg border border-border p-8">
                  <p className="text-muted-foreground">Quiz component placeholder</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <p>This is lesson content from the CMS. In a full implementation, this would render rich text content from Sanity.</p>
                  <p>Topics covered in this lesson:</p>
                  <ul>
                    <li>Core concepts and fundamentals</li>
                    <li>Practical examples and code</li>
                    <li>Best practices and tips</li>
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex items-center justify-between gap-4 pt-6">
            {prevLesson ? (
              <Button variant="outline" asChild>
                <Link href={`/courses/${course.slug}/lessons/${prevLesson.id}`}>
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Previous
                </Link>
              </Button>
            ) : (
              <div />
            )}
            {nextLesson ? (
              <Button asChild>
                <Link href={`/courses/${course.slug}/lessons/${nextLesson.id}`}>
                  Next Lesson
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <Button>
                <CheckCircle className="mr-2 h-4 w-4" />
                Complete Course
              </Button>
            )}
          </div>
        </div>

        {/* Sidebar - Course Progress */}
        <div className="lg:col-span-1">
          <Card className="sticky top-20">
            <CardContent className="p-4">
              <h3 className="font-semibold mb-4">Course Lessons</h3>
              <div className="space-y-2">
                {lessons.map((l, index) => (
                  <Link
                    key={l.id}
                    href={`/courses/${course.slug}/lessons/${l.id}`}
                    className={`block rounded-lg p-3 text-sm transition-colors ${
                      l.id === lesson.id
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{index + 1}.</span>
                      <span className="line-clamp-2">{l.title}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
