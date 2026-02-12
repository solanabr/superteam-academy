import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, BookOpen } from 'lucide-react';
import type { Course } from '@/lib/types';

interface CourseCardProps {
  course: Course;
}

export function CourseCard({ course }: CourseCardProps) {
  const difficultyColors = {
    beginner: 'bg-green-500/10 text-green-500 border-green-500/20',
    intermediate: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    advanced: 'bg-red-500/10 text-red-500 border-red-500/20'
  };

  return (
    <Link href={`/courses/${course.slug}`}>
      <Card className="group overflow-hidden transition-all hover:shadow-lg hover:border-primary/50">
        <CardHeader className="p-0">
          <div className="relative aspect-video overflow-hidden bg-muted">
            {course.thumbnail_url ? (
              <Image
                src={course.thumbnail_url}
                alt={course.title}
                fill
                className="object-cover transition-transform group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <BookOpen className="h-16 w-16 text-muted-foreground/50" />
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="mb-2 flex items-center gap-2">
            {course.difficulty && (
              <Badge variant="outline" className={difficultyColors[course.difficulty]}>
                {course.difficulty}
              </Badge>
            )}
            {course.category && (
              <Badge variant="secondary">{course.category}</Badge>
            )}
          </div>
          <h3 className="mb-2 font-semibold text-lg line-clamp-2 group-hover:text-primary transition-colors">
            {course.title}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {course.description}
          </p>
        </CardContent>
        <CardFooter className="p-4 pt-0 flex items-center gap-4 text-sm text-muted-foreground">
          {course.duration_minutes && (
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{Math.round(course.duration_minutes / 60)}h</span>
            </div>
          )}
        </CardFooter>
      </Card>
    </Link>
  );
}
