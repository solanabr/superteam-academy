// app/src/app/(dashboard)/courses/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useProgram } from "@/hooks/useProgram";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";

export default function CoursesPage() {
  const { fetchCourses, getUserEnrollment } = useProgram();
  const { publicKey } = useWallet();
  const router = useRouter();
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  // Храним статус записи для каждого курса: { "anchor-101": true/false }
  const [enrollments, setEnrollments] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchCourses().then(async (data) => {
      setCourses(data);
      
      // Если кошелек подключен, проверяем записи для всех курсов
      if (publicKey) {
        const statusMap: Record<string, boolean> = {};
        for (const course of data) {
            const enrollment = await getUserEnrollment(course.account.courseId);
            statusMap[course.account.courseId] = !!enrollment;
        }
        setEnrollments(statusMap);
      }
      
      setLoading(false);
    });
  }, [fetchCourses, getUserEnrollment, publicKey]);

  const handleCourseClick = (courseId: string) => {
    // Всегда ведем на страницу деталей, там логика Enroll/Continue
    router.push(`/courses/${courseId}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Courses</h2>
        <p className="text-muted-foreground">Master Solana development from zero to hero.</p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex flex-col space-y-3">
              <Skeleton className="h-[125px] w-full rounded-xl" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-[200px]" />
              </div>
            </div>
          ))
        ) : (
          courses.map((course) => {
            const isEnrolled = enrollments[course.account.courseId];
            
            return (
                <Card key={course.publicKey.toString()} className="flex flex-col justify-between hover:border-primary/50 transition-colors">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                        <CardTitle className="text-xl">{course.account.courseId}</CardTitle>
                        {isEnrolled && <Badge variant="secondary" className="bg-green-900 text-green-100">Enrolled</Badge>}
                    </div>
                    <CardDescription>
                      {course.account.xpPerLesson.toString()} XP per lesson
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-muted-foreground">
                       {course.account.lessonCount} Lessons • Beginner Friendly
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                        className="w-full" 
                        variant={isEnrolled ? "secondary" : "default"}
                        onClick={() => handleCourseClick(course.account.courseId)}
                    >
                        {isEnrolled ? "Continue Learning" : "Start Learning"}
                    </Button>
                  </CardFooter>
                </Card>
            );
          })
        )}
      </div>
    </div>
  );
}