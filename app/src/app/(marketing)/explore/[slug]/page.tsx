'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks';
import {
  Clock,
  BookOpen,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  PlayCircle,
  Lock,
  Award,
  Wrench,
  CreditCard,
  Palette,
  Coins,
  Target,
} from 'lucide-react';

const difficultyColors = {
  beginner: 'bg-green-500/10 text-green-500 border-green-500/20',
  intermediate: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  advanced: 'bg-red-500/10 text-red-500 border-red-500/20',
};

export default function CoursePreviewPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const { user } = useAuth();
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const handleStartCourse = () => {
    if (user) {
      // User is authenticated, redirect to discover page for the course
      router.push(`/discover?enroll=${slug}`);
    } else {
      // User is not authenticated, redirect to sign in with callback
      const callbackUrl = encodeURIComponent(`/discover?enroll=${slug}`);
      router.push(`/auth/signin?callbackUrl=${callbackUrl}`);
    }
  };

  useEffect(() => {
    const fetchCourse = async () => {
      if (!slug) return;

      try {
        const response = await fetch(`/api/courses/${slug}`);
        if (!response.ok) {
          setCourse(null);
          return;
        }

        const data = await response.json();
        setCourse(data.course);
      } catch (error) {
        console.error('Failed to fetch course:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [slug]);

  if (loading) {
    return (
      <div className="container py-12">
        <p className="text-muted-foreground">Loading course...</p>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="container py-12">
        <Link
          href="/explore"
          className="text-muted-foreground hover:text-foreground mb-8 inline-flex items-center gap-2 text-sm transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Courses
        </Link>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Course not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-12">
      {/* Back Button */}
      <Link
        href="/explore"
        className="text-muted-foreground hover:text-foreground mb-8 inline-flex items-center gap-2 text-sm transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Courses
      </Link>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {/* Course Header */}
          <div className="mb-8">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className={`capitalize ${difficultyColors[course.difficulty as keyof typeof difficultyColors]}`}
              >
                {course.difficulty}
              </Badge>
              {course.track && <Badge variant="secondary">{course.track}</Badge>}
              <Badge className="border-purple-500/20 bg-purple-500/10 text-purple-500">
                Preview Mode
              </Badge>
            </div>

            <h1 className="mb-4 text-3xl font-bold md:text-4xl">{course.title}</h1>
            <p className="text-muted-foreground mb-4 text-lg">{course.description}</p>

            {/* Instructor */}
            {course.instructor && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Instructor:</span>
                <span className="font-medium">{course.instructor}</span>
              </div>
            )}
          </div>

          {/* Course Stats */}
          <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg">
                  <BookOpen className="text-primary h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{course.modules.length}</p>
                  <p className="text-muted-foreground text-sm">Modules</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg">
                  <PlayCircle className="text-primary h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {course.modules.reduce((acc: number, m: any) => acc + m.lessons.length, 0)}
                  </p>
                  <p className="text-muted-foreground text-sm">Lessons</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg">
                  <Clock className="text-primary h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {Math.floor(course.duration / 60)}h {course.duration % 60}m
                  </p>
                  <p className="text-muted-foreground text-sm">Duration</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Learning Objectives */}
          {course.learningObjectives && course.learningObjectives.length > 0 && (
            <div className="mb-8">
              <h2 className="mb-4 text-xl font-semibold">What You&apos;ll Learn</h2>
              <Card>
                <CardContent className="p-6">
                  <ul className="grid gap-3 md:grid-cols-2">
                    {course.learningObjectives.map((objective: string, index: number) => (
                      <li key={index} className="flex items-start gap-3">
                        <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-green-500" />
                        <span className="text-sm">{objective}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Course Curriculum */}
          <div className="mb-8">
            <h2 className="mb-4 text-xl font-semibold">Course Curriculum</h2>
            <div className="space-y-4">
              {course.modules.map((module: any, moduleIndex: number) => (
                <Card key={module.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">
                        Module {moduleIndex + 1}: {module.title}
                      </CardTitle>
                      <Badge variant="outline" className="text-xs">
                        {module.lessons.length} lessons
                      </Badge>
                    </div>
                    {module.description && <CardDescription>{module.description}</CardDescription>}
                  </CardHeader>
                  <CardContent className="pt-0">
                    <ul className="space-y-2">
                      {module.lessons.map((lesson: any, lessonIndex: number) => (
                        <li
                          key={lesson.id}
                          className="flex items-center justify-between rounded-lg border p-3"
                        >
                          <div className="flex items-center gap-3">
                            <div className="bg-muted flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium">
                              {lessonIndex + 1}
                            </div>
                            <div>
                              <p className="font-medium">{lesson.title}</p>
                              <div className="text-muted-foreground flex items-center gap-2 text-xs">
                                <span className="capitalize">{lesson.type}</span>
                                <span>•</span>
                                <span>{lesson.duration} min</span>
                              </div>
                            </div>
                          </div>
                          <Lock className="text-muted-foreground h-4 w-4" />
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Tags */}
          {course.tags && course.tags.length > 0 && (
            <div className="mb-8">
              <h2 className="mb-4 text-xl font-semibold">Topics Covered</h2>
              <div className="flex flex-wrap gap-2">
                {course.tags.map((tag: string) => (
                  <Badge key={tag} variant="secondary" className="text-sm">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-24">
            <Card className="overflow-hidden">
              {/* Course Thumbnail */}
              <div className="relative h-48 bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                <div className="absolute inset-0 flex items-center justify-center opacity-50">
                  {course.track === 'Core' && <Target className="h-16 w-16" />}
                  {course.track === 'Development' && <Wrench className="h-16 w-16" />}
                  {course.track === 'Payments' && <CreditCard className="h-16 w-16" />}
                  {course.track === 'NFTs' && <Palette className="h-16 w-16" />}
                  {course.track === 'DeFi' && <Coins className="h-16 w-16" />}
                  {!course.track && <BookOpen className="h-16 w-16" />}
                </div>
              </div>

              <CardContent className="p-6">
                <div className="mb-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Difficulty</span>
                    <Badge
                      variant="outline"
                      className={`capitalize ${difficultyColors[course.difficulty as keyof typeof difficultyColors]}`}
                    >
                      {course.difficulty}
                    </Badge>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Duration</span>
                    <span className="font-medium">
                      {Math.floor(course.duration / 60)}h {course.duration % 60}m
                    </span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Certificate</span>
                    <span className="flex items-center gap-1 font-medium text-green-500">
                      <Award className="h-4 w-4" />
                      On-chain NFT
                    </span>
                  </div>
                  {course.instructor && (
                    <>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Instructor</span>
                        <span className="font-medium">{course.instructor}</span>
                      </div>
                    </>
                  )}
                </div>

                <Button className="mb-4 w-full" size="lg" onClick={handleStartCourse}>
                  Start Course
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>

                <p className="text-muted-foreground text-center text-sm">
                  {user
                    ? 'Click to enroll and start learning'
                    : 'Sign in to enroll and start learning'}
                </p>
              </CardContent>
            </Card>

            {/* Prerequisites */}
            {course.prerequisites && course.prerequisites.length > 0 && (
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle className="text-lg">Prerequisites</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {course.prerequisites.map((prereq: string, index: number) => (
                      <li
                        key={index}
                        className="text-muted-foreground flex items-center gap-2 text-sm"
                      >
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        {prereq}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
