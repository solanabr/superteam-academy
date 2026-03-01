'use client';

import { BookOpen, Users, BarChart2, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Link } from '@/i18n/routing';

type CourseStatus = 'active' | 'draft';

interface CreatorCourse {
  id: string;
  title: string;
  status: CourseStatus;
  enrollments: number;
  completionRate: number;
  xpRewardsEarned: number;
}

const STATUS_STYLES: Record<CourseStatus, string> = {
  active: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/25',
  draft: 'bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/25',
};

const MOCK_COURSES: CreatorCourse[] = [
  {
    id: 'solana-101',
    title: 'Solana 101: From Zero to Hero',
    status: 'active',
    enrollments: 342,
    completionRate: 67,
    xpRewardsEarned: 12400,
  },
  {
    id: 'anchor-deep-dive',
    title: 'Anchor Framework Deep Dive',
    status: 'active',
    enrollments: 198,
    completionRate: 45,
    xpRewardsEarned: 6800,
  },
  {
    id: 'token-extensions',
    title: 'Token-2022 Extensions Masterclass',
    status: 'draft',
    enrollments: 0,
    completionRate: 0,
    xpRewardsEarned: 0,
  },
];

interface MyCoursesProps {
  className?: string;
}

export function MyCourses({ className }: MyCoursesProps) {
  return (
    <Card className={cn('py-0', className)}>
      <CardHeader className="pt-4 px-4 pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">My Courses</CardTitle>
          <span className="text-xs text-muted-foreground">
            {MOCK_COURSES.length} courses
          </span>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="space-y-3">
          {MOCK_COURSES.map((course) => (
            <div
              key={course.id}
              className="rounded-lg border p-4 transition-colors hover:bg-muted/30"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <BookOpen className="size-4 shrink-0 text-muted-foreground" />
                    <h3 className="truncate text-sm font-semibold">{course.title}</h3>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn('mt-1.5', STATUS_STYLES[course.status])}
                  >
                    {course.status}
                  </Badge>
                </div>
              </div>

              {/* Stats */}
              <div className="mt-3 grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Enrollments</p>
                  <p className="flex items-center gap-1 text-sm font-semibold">
                    <Users className="size-3 text-muted-foreground" />
                    {course.enrollments.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Completion</p>
                  <div className="flex items-center gap-2">
                    <Progress value={course.completionRate} className="h-1.5 flex-1" />
                    <span className="text-xs font-medium">{course.completionRate}%</span>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">XP Earned</p>
                  <p className="text-sm font-semibold">
                    {course.xpRewardsEarned.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-3 flex items-center gap-2">
                <Button variant="outline" size="sm" className="h-7 gap-1.5 text-xs" asChild>
                  <Link href={`/courses/${course.id}`}>
                    <BarChart2 className="size-3" />
                    View Analytics
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs" asChild>
                  <a href="/studio" target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="size-3" />
                    Edit in CMS
                  </a>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
