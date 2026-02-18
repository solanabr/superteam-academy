'use client';

import { FC } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, BookOpen, Zap, Users, ChevronRight } from 'lucide-react';

export interface Course {
  id: string;
  slug: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  track: string;
  lessonCount: number;
  xpReward: number;
  estimatedMinutes: number;
  enrolledCount: number;
  imageUrl?: string;
}

interface CourseCardProps {
  course: Course;
}

const difficultyColors = {
  beginner: 'bg-green-500/10 text-green-500 border-green-500/20',
  intermediate: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  advanced: 'bg-red-500/10 text-red-500 border-red-500/20',
};

const difficultyLabels = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

export const CourseCard: FC<CourseCardProps> = ({ course }) => {
  return (
    <Card className="group hover:shadow-lg transition-shadow duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="text-xs">
              {course.track}
            </Badge>
            <Badge className={`text-xs ${difficultyColors[course.difficulty]}`}>
              {difficultyLabels[course.difficulty]}
            </Badge>
          </div>
        </div>
        <CardTitle className="text-lg mt-2 group-hover:text-primary transition-colors">
          {course.title}
        </CardTitle>
      </CardHeader>

      <CardContent className="pb-3">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {course.description}
        </p>

        <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <BookOpen className="h-4 w-4" />
            {course.lessonCount} lessons
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {course.estimatedMinutes} min
          </span>
          <span className="flex items-center gap-1">
            <Zap className="h-4 w-4 text-yellow-500" />
            {course.xpReward} XP
          </span>
        </div>
      </CardContent>

      <CardFooter className="pt-0 flex items-center justify-between">
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Users className="h-3 w-3" />
          {course.enrolledCount.toLocaleString()} enrolled
        </span>
        <Button asChild variant="ghost" size="sm" className="gap-1">
          <Link href={`/courses/${course.slug}`}>
            View Course
            <ChevronRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
};
