// app/src/app/(dashboard)/courses/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useProgram } from "@/hooks/useProgram";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

export default function CoursesPage() {
  const { fetchCourses } = useProgram();
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourses().then((data) => {
      setCourses(data);
      setLoading(false);
    });
  }, [fetchCourses]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Courses</h2>
        <p className="text-muted-foreground">Master Solana development from zero to hero.</p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          // Скелетоны при загрузке (для UX)
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
          courses.map((course) => (
            <Card key={course.publicKey.toString()} className="flex flex-col justify-between">
              <CardHeader>
                <div className="flex justify-between items-start">
                    <CardTitle className="text-xl">{course.account.courseId}</CardTitle>
                    <Badge variant="outline">XP: {course.account.xpPerLesson.toString()}</Badge>
                </div>
                <CardDescription>
                  Start your journey into Solana development with this comprehensive course.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">
                   {course.account.lessonCount} Lessons • Beginner Friendly
                </div>
              </CardContent>
              <CardFooter>
                <Link href={`/courses/${course.account.courseId}`} className="w-full">
                    <Button className="w-full">Start Learning</Button>
                </Link>
              </CardFooter>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}