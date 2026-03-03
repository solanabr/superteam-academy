// app/src/components/course-progress.tsx
"use client";

import { Progress } from "@/components/ui/progress";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Link } from "@/i18n/navigation";

interface CourseProgressProps {
  courseId: string;
  // Передаем данные прямо из хука useUser
  enrollmentData: {
      progressPercent: number;
      totalLessons: number;
      completedLessons: number;
  };
}

export function CourseProgress({ courseId, enrollmentData }: CourseProgressProps) {
  
  if (!enrollmentData) return null;

  const progressPercent = enrollmentData.progressPercent || 0;
  const completed = enrollmentData.completedLessons || 0;
  const total = enrollmentData.totalLessons || 1; // Защита от нуля

  const isCompleted = enrollmentData.progressPercent === 100;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
            <CardTitle className="text-lg">{courseId}</CardTitle>
            <span className="text-sm font-medium bg-muted px-2 py-1 rounded-md">
                {/* Теперь тут точно будут числа */}
                {completed} / {total} Lessons
            </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Progress 
            value={enrollmentData.progressPercent} 
            className="h-2" 
            aria-label={`Learning progress for ${courseId}`} 
            aria-valuenow={enrollmentData.progressPercent}
        />
        
        <div className="flex justify-between text-xs text-muted-foreground font-medium">
            <span>0%</span>
            {isCompleted ? (
                <span className="text-green-500 flex items-center gap-1"><CheckCircle2 className="h-3 w-3"/> Completed</span>
            ) : (
                <span>{progressPercent}%</span>
            )}
            <span>100%</span>
        </div>
        
        <Link href={`/courses/${courseId}`} className="block w-full">
            <Button className="w-full" variant={isCompleted ? "outline" : "secondary"}>
                {isCompleted ? "Review Material" : "Continue Learning"} <ArrowRight className="ml-2 h-4 w-4"/>
            </Button>
        </Link>
      </CardContent>
    </Card>
  );
}