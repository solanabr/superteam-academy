'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Loader2, BookOpen } from 'lucide-react';
import { getCourseService } from '@/lib/services';
import { Course } from '@/lib/types/domain';
import { getDifficultyVariant, formatDuration } from '@/lib/utils';

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCourses() {
      try {
        const courseService = getCourseService();
        const allCourses = await courseService.getAllCourses();
        setCourses(allCourses);
      } finally {
        setLoading(false);
      }
    }
    loadCourses();
  }, []);

  if (loading) {
    return (
      <div className="container flex min-h-[600px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">All Courses</h1>
        <p className="text-muted-foreground">
          Master Solana development through interactive courses
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <Link key={course.id} href={`/courses/${course.slug}`}>
            <Card className="h-full hover:border-primary transition-colors cursor-pointer">
              <CardHeader>
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant={getDifficultyVariant(course.difficulty) as any}>
                    {course.difficulty}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {formatDuration(course.durationMinutes)}
                  </span>
                </div>
                <CardTitle>{course.title}</CardTitle>
                <CardDescription>{course.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <BookOpen className="h-4 w-4" />
                    {course.modules.reduce((acc, m) => acc + m.lessons.length, 0)} lessons
                  </span>
                  <Badge variant="secondary" className="gap-1">
                    <Trophy className="h-3 w-3" />
                    {course.xpReward} XP
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}