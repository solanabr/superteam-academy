'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useWalletContext } from '@/components/providers/wallet-provider';
import { useAuth } from '@/components/providers';
import {
  Clock,
  BookOpen,
  Zap,
  CheckCircle2,
  Circle,
  PlayCircle,
  Lock,
  ArrowLeft,
  User,
  Star,
} from 'lucide-react';
import { getLucideIcon } from '@/lib/icon-utils';

const difficultyColors = {
  beginner: 'bg-green-500/10 text-green-500',
  intermediate: 'bg-yellow-500/10 text-yellow-500',
  advanced: 'bg-red-500/10 text-red-500',
};

const trackIcons: Record<string, string> = {
  Core: 'target',
  Development: 'code',
  Payments: 'credit-card',
  NFTs: 'palette',
  DeFi: 'coins',
};

export default function CourseDetailPage() {
  const params = useParams();
  const { connected, connect } = useWalletContext();
  const { user } = useAuth();
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [completedLessons, setCompletedLessons] = useState(0);

  useEffect(() => {
    const fetchCourse = async () => {
      if (typeof params.slug !== 'string') return;

      try {
        const response = await fetch(`/api/courses/${params.slug}`);
        if (!response.ok) {
          setCourse(null);
          return;
        }

        const data = await response.json();
        setCourse(data.course);
      } catch (error) {
        console.error('Failed to fetch course:', error);
        setCourse(null);
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [params.slug]);

  useEffect(() => {
    const fetchEnrollment = async () => {
      if (!user?.id || !course?.id) return;

      try {
        const response = await fetch(`/api/progress?userId=${user.id}&courseId=${course.id}`);
        if (!response.ok) return;

        const data = await response.json();
        if (data.progress) {
          setIsEnrolled(true);
          setCompletedLessons(data.progress.lessonsCompleted || 0);
        } else {
          setIsEnrolled(false);
          setCompletedLessons(0);
        }
      } catch (error) {
        console.error('Failed to fetch enrollment:', error);
      }
    };

    fetchEnrollment();
  }, [user?.id, course?.id]);

  if (!loading && !course) {
    return (
      <div className="container py-8">
        <Link
          href="/courses"
          className="text-muted-foreground hover:text-foreground mb-6 inline-flex items-center gap-2 text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Courses
        </Link>
        <Card className="py-12 text-center">
          <CardContent>
            <p className="text-muted-foreground">Course not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container py-8">
        <p className="text-muted-foreground">Loading course...</p>
      </div>
    );
  }

  const totalLessons = course
    ? course.modules.reduce((acc: number, m: any) => acc + m.lessons.length, 0)
    : 0;

  const progressPercentage =
    totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  // Find next lesson to continue
  let nextLesson: { id: string; slug: string } | null = null;
  if (course) {
    for (const courseModule of course.modules) {
      for (const lesson of courseModule.lessons) {
        // In production, check completion status
        nextLesson = { id: lesson.id, slug: lesson.slug };
        break;
      }
      if (nextLesson) break;
    }
  }

  const handleEnroll = async () => {
    if (!connected) {
      await connect();
      return;
    }

    if (!user?.id || !course?.id) {
      return;
    }

    try {
      const totalChallenges = (course.modules || []).reduce(
        (acc: number, courseModule: any) =>
          acc + courseModule.lessons.filter((lesson: any) => lesson.type === 'challenge').length,
        0
      );

      const response = await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'enroll',
          userId: user.id,
          courseId: course.id,
          courseSlug: course.slug,
          totalLessons,
          totalChallenges,
        }),
      });

      if (response.ok) {
        setIsEnrolled(true);
      }
    } catch (error) {
      console.error('Failed to enroll:', error);
    }
  };

  return (
    <div className="container py-8">
      {/* Back button */}
      <Link
        href="/courses"
        className="text-muted-foreground hover:text-foreground mb-6 inline-flex items-center gap-2 text-sm"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Courses
      </Link>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2">
          {/* Course header */}
          <div className="mb-6">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className={
                  difficultyColors[
                    (course?.difficulty || 'beginner') as keyof typeof difficultyColors
                  ]
                }
              >
                {course?.difficulty}
              </Badge>
              <Badge variant="secondary">
                {(() => {
                  const Icon = getLucideIcon(trackIcons[course?.track || '']);
                  return <Icon className="mr-1 h-3 w-3" />;
                })()}
                {course?.track}
              </Badge>
            </div>
            <h1 className="mb-4 text-3xl font-bold">{course?.title}</h1>
            <p className="text-muted-foreground text-lg">{course?.description}</p>
            
            {/* Instructor */}
            {course?.instructor && (
              <div className="mt-4 flex items-center gap-3">
                <div className="bg-muted flex h-10 w-10 items-center justify-center rounded-full">
                  <User className="text-muted-foreground h-5 w-5" />
                </div>
                <div>
                  <div className="font-medium">{course.instructor.name}</div>
                  {course.instructor.bio && (
                    <div className="text-muted-foreground text-sm">{course.instructor.bio}</div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div className="rounded-lg border p-4 text-center">
              <Clock className="text-muted-foreground mx-auto mb-2 h-5 w-5" />
              <div className="font-semibold">
                {Math.floor((course?.duration || 0) / 60)}h {(course?.duration || 0) % 60}m
              </div>
              <div className="text-muted-foreground text-xs">Duration</div>
            </div>
            <div className="rounded-lg border p-4 text-center">
              <BookOpen className="text-muted-foreground mx-auto mb-2 h-5 w-5" />
              <div className="font-semibold">{totalLessons}</div>
              <div className="text-muted-foreground text-xs">Lessons</div>
            </div>
            <div className="rounded-lg border p-4 text-center">
              <Zap className="mx-auto mb-2 h-5 w-5 text-yellow-500" />
              <div className="font-semibold">{course?.xpReward || 0}</div>
              <div className="text-muted-foreground text-xs">XP Reward</div>
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="syllabus">
            <TabsList className="mb-6">
              <TabsTrigger value="syllabus">Syllabus</TabsTrigger>
              <TabsTrigger value="objectives">Objectives</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
            </TabsList>

            <TabsContent value="syllabus">
              {course?.modules ? (
                <div className="space-y-4">
                  {course.modules.map((courseModule: any, moduleIndex: number) => (
                    <Card key={courseModule.id}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">
                            Module {moduleIndex + 1}: {courseModule.title}
                          </CardTitle>
                          <span className="text-muted-foreground text-sm">
                            {courseModule.lessons.length} lessons
                          </span>
                        </div>
                        {courseModule.description && (
                          <p className="text-muted-foreground text-sm">{courseModule.description}</p>
                        )}
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {courseModule.lessons.map((lesson: any, lessonIndex: number) => {
                            const isLocked = !isEnrolled && lessonIndex > 0;

                            return (
                              <Link
                                key={lesson.id}
                                href={
                                  isLocked ? '#' : `/courses/${course.slug}/lessons/${lesson.slug}`
                                }
                                className={`flex items-center justify-between rounded-lg border p-3 transition-colors ${
                                  isLocked ? 'cursor-not-allowed opacity-50' : 'hover:bg-muted/50'
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  {isLocked ? (
                                    <Lock className="text-muted-foreground h-5 w-5" />
                                  ) : lesson.type === 'challenge' ? (
                                    <PlayCircle className="text-primary h-5 w-5" />
                                  ) : (
                                    <Circle className="text-muted-foreground h-5 w-5" />
                                  )}
                                  <div>
                                    <div className="font-medium">{lesson.title}</div>
                                    <div className="text-muted-foreground flex items-center gap-2 text-xs">
                                      <span>{lesson.duration} min</span>
                                      {lesson.type === 'challenge' && (
                                        <Badge variant="outline" className="text-xs">
                                          Challenge
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1 text-sm text-yellow-500">
                                  <Zap className="h-4 w-4" />
                                  {lesson.xpReward}
                                </div>
                              </Link>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="py-8 text-center">
                    <p className="text-muted-foreground">Course content coming soon.</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="objectives">
              <Card>
                <CardContent className="py-6">
                  {course?.learningObjectives ? (
                    <ul className="space-y-3">
                      {course.learningObjectives.map((objective: string, index: number) => (
                        <li key={index} className="flex items-start gap-3">
                          <CheckCircle2 className="text-primary mt-0.5 h-5 w-5 flex-shrink-0" />
                          <span>{objective}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted-foreground text-center">
                      Learning objectives will be available soon.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reviews">
              <div className="space-y-4">
                {/* Static reviews for MVP */}
                {[
                  {
                    id: 1,
                    name: 'Maria Santos',
                    rating: 5,
                    date: '2 weeks ago',
                    comment: 'Excellent course! The explanations are clear and the hands-on challenges really helped me understand the concepts.',
                  },
                  {
                    id: 2,
                    name: 'Pedro Alves',
                    rating: 5,
                    date: '1 month ago',
                    comment: 'Great introduction to Solana development. The instructor covers all the fundamentals you need to get started.',
                  },
                  {
                    id: 3,
                    name: 'Carlos Lima',
                    rating: 4,
                    date: '1 month ago',
                    comment: 'Very informative course with practical examples. Would love to see more advanced topics covered.',
                  },
                ].map((review) => (
                  <Card key={review.id}>
                    <CardContent className="py-4">
                      <div className="mb-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="bg-muted flex h-10 w-10 items-center justify-center rounded-full">
                            <User className="text-muted-foreground h-5 w-5" />
                          </div>
                          <div>
                            <div className="font-medium">{review.name}</div>
                            <div className="text-muted-foreground text-xs">{review.date}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < review.rating
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-muted-foreground'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-muted-foreground text-sm">{review.comment}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <Card className="sticky top-24">
            {/* Thumbnail placeholder */}
            <div className="relative h-48 bg-gradient-to-br from-purple-500/20 to-pink-500/20">
              <div className="absolute inset-0 flex items-center justify-center text-8xl opacity-50">
                {(() => {
                  const Icon = getLucideIcon(trackIcons[course?.track || ''] || 'book-open');
                  return <Icon className="h-16 w-16" />;
                })()}
              </div>
            </div>
            <CardContent className="p-6">
              {isEnrolled ? (
                <>
                  <div className="mb-4">
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span>Your progress</span>
                      <span className="font-semibold">{progressPercentage}%</span>
                    </div>
                    <Progress value={progressPercentage} />
                    <p className="text-muted-foreground mt-2 text-xs">
                      {completedLessons} of {totalLessons} lessons completed
                    </p>
                  </div>
                  <Separator className="my-4" />
                  {nextLesson ? (
                    <Button className="w-full" asChild>
                      <Link href={`/courses/${params.slug}/lessons/${nextLesson.slug}`}>
                        Continue Learning
                      </Link>
                    </Button>
                  ) : course ? (
                    <Button className="w-full" asChild>
                      <Link
                        href={`/courses/${params.slug}/lessons/${course.modules[0]?.lessons[0]?.slug}`}
                      >
                        Start Learning
                      </Link>
                    </Button>
                  ) : (
                    <Button className="w-full" variant="secondary" disabled>
                      Coming Soon
                    </Button>
                  )}
                </>
              ) : (
                <>
                  <div className="mb-4 text-center">
                    <div className="mb-1 text-2xl font-bold">Free</div>
                    <p className="text-muted-foreground text-sm">
                      Earn {course?.xpReward || 0} XP upon completion
                    </p>
                  </div>
                  <Button className="w-full" onClick={handleEnroll}>
                    {connected ? 'Enroll Now' : 'Connect Wallet to Enroll'}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
