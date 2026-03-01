// app/src/components/course-progress.tsx
"use client";

import { useEffect, useState } from "react";
import { useProgram } from "@/hooks/useProgram";
import { Progress } from "@/components/ui/progress";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BN } from "@coral-xyz/anchor";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { ArrowRight } from "lucide-react";

// Функция для подсчета пройденных уроков из битовой маски (из INTEGRATION.md)
function countCompletedLessons(lessonFlags: BN[]): number {
  if (!lessonFlags) return 0;
  return lessonFlags.reduce((sum, word) => {
    let count = 0;
    let w = word.clone();
    while (!w.isZero()) {
      count += w.and(new BN(1)).toNumber();
      w = w.shrn(1);
    }
    return sum + count;
  }, 0);
}

export function CourseProgress({ courseId }: { courseId: string }) {
  const { getUserEnrollment } = useProgram();
  const [enrollment, setEnrollment] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // В реальном проекте lessonCount нужно читать из аккаунта Course
  // Для хакатона захардкодим 10 уроков для демо
  const totalLessons = 10; 

  useEffect(() => {
    getUserEnrollment(courseId).then((data) => {
      setEnrollment(data);
      setLoading(false);
    });
  }, [courseId, getUserEnrollment]);

  if (loading) return <Skeleton className="h-[200px] w-full rounded-xl" />;
  
  if (!enrollment) {
      // Если записи нет - предлагаем начать
      return (
        <Card>
            <CardHeader>
                <CardTitle>Start Learning</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground mb-4">You have not started any courses yet.</p>
                <Link href="/courses">
                    <Button>Browse Courses <ArrowRight className="ml-2 h-4 w-4"/></Button>
                </Link>
            </CardContent>
        </Card>
      );
  }

  const completedCount = countCompletedLessons(enrollment.lessonFlags);
  const progressPercent = Math.round((completedCount / totalLessons) * 100);

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
            <CardTitle>Current Course: {courseId}</CardTitle>
            <span className="text-sm font-medium text-muted-foreground">{completedCount} / {totalLessons} Lessons</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Progress value={progressPercent} className="h-2" aria-label="Course progress" />
        <div className="flex justify-between text-xs text-muted-foreground">
            <span>0%</span>
            <span>{progressPercent}% Complete</span>
            <span>100%</span>
        </div>
        <Link href={`/courses/${courseId}`} className="block w-full">
            <Button className="w-full" variant="secondary">Continue Learning</Button>
        </Link>
      </CardContent>
    </Card>
  );
}