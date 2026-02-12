import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { courseService } from '@/lib/services/course.service';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, BookOpen, Award, CheckCircle2, ArrowRight } from 'lucide-react';

interface CoursePageProps {
  params: Promise<{ slug: string }>;
}

export default async function CoursePage({ params }: CoursePageProps) {
  const { slug } = await params;
  const course = await courseService.getCourseBySlug(slug);

  if (!course) {
    notFound();
  }

  const lessons = await courseService.getCourseLessons(course.id);

  return (
    <div className="flex flex-col">
      {/* Course Header */}
      <section className="border-b border-border bg-muted/30">
        <div className="container py-12">
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="space-y-6">
              <div className="flex gap-2">
                {course.difficulty && (
                  <Badge variant="outline">{course.difficulty}</Badge>
                )}
                {course.category && (
                  <Badge variant="secondary">{course.category}</Badge>
                )}
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-balance">
                {course.title}
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed">
                {course.description}
              </p>
              <div className="flex flex-wrap gap-6 text-sm">
                {course.duration_minutes && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{Math.round(course.duration_minutes / 60)} hours</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                  <span>{lessons.length} lessons</span>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-muted-foreground" />
                  <span>NFT Certificate</span>
                </div>
              </div>
              <div className="pt-4">
                <Button size="lg" asChild>
                  <Link href={`/courses/${course.slug}/lessons/${lessons[0]?.id}`}>
                    Start Course
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </div>
            </div>
            <div className="relative aspect-video overflow-hidden rounded-lg border border-border">
              {course.thumbnail_url ? (
                <Image
                  src={course.thumbnail_url}
                  alt={course.title}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-muted">
                  <BookOpen className="h-24 w-24 text-muted-foreground/50" />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Course Content */}
      <section className="container py-12">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Curriculum */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Course Curriculum</CardTitle>
              </CardHeader>
              <CardContent>
                {lessons.length > 0 ? (
                  <div className="space-y-2">
                    {lessons.map((lesson, index) => (
                      <Link
                        key={lesson.id}
                        href={`/courses/${course.slug}/lessons/${lesson.id}`}
                        className="flex items-center gap-4 rounded-lg border border-border p-4 transition-colors hover:bg-muted"
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                          {index + 1}
                        </div>
                        <div className="flex-1 space-y-1">
                          <p className="font-medium">{lesson.title}</p>
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {lesson.description}
                          </p>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          {lesson.duration_minutes && (
                            <span>{lesson.duration_minutes} min</span>
                          )}
                          <Badge variant="outline" className="shrink-0">
                            {lesson.lesson_type}
                          </Badge>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No lessons available yet
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>What You'll Learn</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {[
                    'Solana blockchain fundamentals',
                    'Smart contract development',
                    'Web3.js integration',
                    'DApp deployment',
                    'Best practices & security'
                  ].map((item, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-primary mt-0.5" />
                      <span className="text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
