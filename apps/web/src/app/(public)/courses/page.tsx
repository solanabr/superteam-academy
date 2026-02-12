'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Search,
  Clock,
  BookOpen,
  Zap,
  ArrowRight,
  Shield,
  Code2,
  Target,
} from 'lucide-react';
import { courses, learningPaths, type Difficulty } from '@/lib/mock-data';

const difficultyColors: Record<Difficulty, string> = {
  beginner: 'bg-green-500/10 text-green-500 border-green-500/20',
  intermediate: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  advanced: 'bg-red-500/10 text-red-500 border-red-500/20',
};

const pathIcons: Record<string, typeof Target> = {
  'solana-fundamentals-path': BookOpen,
  'defi-developer': Zap,
  'security-auditor': Shield,
  'full-stack-solana': Code2,
};

type FilterType = 'all' | Difficulty;

export default function CoursesPage() {
  const t = useTranslations('courses');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');

  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      const matchesFilter = filter === 'all' || course.difficulty === filter;
      const matchesSearch =
        search === '' ||
        course.title.toLowerCase().includes(search.toLowerCase()) ||
        course.description.toLowerCase().includes(search.toLowerCase()) ||
        course.tags.some((tag) => tag.toLowerCase().includes(search.toLowerCase()));
      return matchesFilter && matchesSearch;
    });
  }, [search, filter]);

  const filters: FilterType[] = ['all', 'beginner', 'intermediate', 'advanced'];

  return (
    <div className="flex flex-col gap-12 pb-20">
      {/* Header */}
      <section className="border-b bg-card/50">
        <div className="container py-12">
          <h1 className="text-3xl font-bold md:text-4xl">{t('title')}</h1>
          <p className="mt-2 text-muted-foreground">{t('subtitle')}</p>
        </div>
      </section>

      {/* Learning Paths */}
      <section className="container">
        <h2 className="mb-6 text-xl font-semibold">{t('learningPaths')}</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {learningPaths.map((path) => {
            const Icon = pathIcons[path.id] ?? Target;
            return (
              <Card
                key={path.id}
                className="group cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:border-primary/50"
              >
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-medium text-sm truncate">{path.title}</h3>
                    <p className="text-xs text-muted-foreground">
                      {path.courseCount} {t('card.lessons')} · {path.estimatedHours}h
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <Separator className="container" />

      {/* Search & Filters */}
      <section className="container">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t('searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            {filters.map((f) => (
              <Button
                key={f}
                variant={filter === f ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter(f)}
                className="rounded-full"
              >
                {t(`filters.${f}`)}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Course Grid */}
      <section className="container">
        {filteredCourses.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground">{t('empty')}</div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredCourses.map((course) => (
              <Link key={course.slug} href={`/courses/${course.slug}`}>
                <Card className="group h-full cursor-pointer overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5">
                  {/* Thumbnail placeholder */}
                  <div className="relative h-40 bg-gradient-to-br from-solana-purple/20 to-solana-green/10">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <BookOpen className="h-12 w-12 text-primary/30" />
                    </div>
                    <div className="absolute right-3 top-3">
                      <Badge variant="outline" className={difficultyColors[course.difficulty]}>
                        {t(`filters.${course.difficulty}`)}
                      </Badge>
                    </div>
                    {course.enrolled && course.progress > 0 && (
                      <div className="absolute bottom-0 left-0 right-0">
                        <Progress value={course.progress} className="h-1 rounded-none" />
                      </div>
                    )}
                  </div>

                  <CardContent className="flex flex-col gap-3 p-5">
                    <h3 className="font-semibold text-lg leading-tight line-clamp-1 group-hover:text-primary transition-colors">
                      {course.title}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {course.description}
                    </p>

                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="bg-primary/10 text-primary text-[10px]">
                          {course.instructor.name.split(' ').map((n) => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs text-muted-foreground">{course.instructor.name}</span>
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <BookOpen className="h-3 w-3" />
                          {course.lessonCount} {t('card.lessons')}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {Math.round(course.duration / 60)}h
                        </span>
                      </div>
                      <span className="flex items-center gap-1 font-medium text-primary">
                        <Zap className="h-3 w-3" />
                        {course.xp} {t('card.xp')}
                      </span>
                    </div>

                    {course.enrolled && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          {course.progress}% {t('card.completed').toLowerCase()}
                        </span>
                        <Button size="sm" variant="ghost" className="h-auto gap-1 p-0 text-xs text-primary">
                          {t('card.continue')}
                          <ArrowRight className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
