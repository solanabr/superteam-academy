'use client';

import { Sparkles, Clock, ArrowRight, Zap } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { Link } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface RecommendedCoursesProps {
  className?: string;
}

interface RecommendedCourse {
  id: string;
  title: string;
  description: string;
  track: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  estimatedHours: number;
  xpReward: number;
  gradient: string;
}

const RECOMMENDED: RecommendedCourse[] = [
  {
    id: 'solana-101',
    title: 'Solana Fundamentals',
    description: 'Learn the architecture that makes Solana fast: accounts, programs, and transactions.',
    track: 'Core',
    difficulty: 'Beginner',
    estimatedHours: 4,
    xpReward: 500,
    gradient: 'from-emerald-500/10 to-teal-500/10',
  },
  {
    id: 'token-program',
    title: 'Token Program Deep Dive',
    description: 'Mint SPL tokens, create ATAs, and work with Token-2022 extensions.',
    track: 'DeFi',
    difficulty: 'Intermediate',
    estimatedHours: 6,
    xpReward: 750,
    gradient: 'from-blue-500/10 to-indigo-500/10',
  },
  {
    id: 'anchor-basics',
    title: 'Building with Anchor',
    description: 'Write, test, and deploy Solana programs using the Anchor framework.',
    track: 'Core',
    difficulty: 'Intermediate',
    estimatedHours: 8,
    xpReward: 1000,
    gradient: 'from-violet-500/10 to-purple-500/10',
  },
];

const DIFFICULTY_VARIANT: Record<string, 'secondary' | 'default' | 'destructive'> = {
  Beginner: 'secondary',
  Intermediate: 'default',
  Advanced: 'destructive',
};

export function RecommendedCourses({ className }: RecommendedCoursesProps) {
  const t = useTranslations('dashboard');
  const tCourses = useTranslations('courses');

  return (
    <Card className={cn('py-0', className)}>
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-primary" />
            <CardTitle className="text-sm">{t('recommended')}</CardTitle>
          </div>
          <Button variant="ghost" size="xs" asChild>
            <Link href="/courses">
              {tCourses('catalog_title')}
              <ArrowRight className="size-3" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 px-4 pb-4">
        {RECOMMENDED.map((course) => (
          <Link
            key={course.id}
            href={`/courses/${course.id}`}
            className="group block"
          >
            <div
              className={cn(
                'rounded-lg border p-3 transition-all hover:shadow-sm',
                'bg-gradient-to-r',
                course.gradient,
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0 space-y-1">
                  <p className="text-sm font-medium group-hover:text-primary transition-colors">
                    {course.title}
                  </p>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {course.description}
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <Badge
                      variant={DIFFICULTY_VARIANT[course.difficulty]}
                      className="text-[10px]"
                    >
                      {course.difficulty}
                    </Badge>
                    <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                      <Clock className="size-3" />
                      {course.estimatedHours}h
                    </span>
                    <span className="flex items-center gap-0.5 text-[10px] text-yellow-600 dark:text-yellow-400">
                      <Zap className="size-3" />
                      {course.xpReward} XP
                    </span>
                  </div>
                </div>

                <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
              </div>
            </div>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
