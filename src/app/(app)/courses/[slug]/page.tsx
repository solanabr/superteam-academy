'use client';

import { use, useMemo } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Zap,
  Clock,
  Users,
  Star,
  BookOpen,
  ChevronRight,
  Lock,
  CheckCircle2,
  PlayCircle,
  Code,
  FileText,
  HelpCircle,
  ArrowLeft,
  Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MOCK_COURSES, MOCK_PROGRESS } from '@/services/mock-data';
import { DIFFICULTY_CONFIG, TRACK_INFO, XP_CONFIG } from '@/config/constants';
import { Lesson } from '@/types';
import { useUserStore } from '@/stores/user-store';

const lessonIcons: Record<Lesson['type'], typeof FileText> = {
  content: FileText,
  challenge: Code,
  video: PlayCircle,
  quiz: HelpCircle,
};

export default function CourseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const { isAuthenticated } = useUserStore();

  const course = useMemo(
    () => MOCK_COURSES.find((c) => c.slug === slug),
    [slug]
  );

  if (!course) {
    notFound();
  }

  const diffConfig = DIFFICULTY_CONFIG[course.difficulty];
  const trackInfo = TRACK_INFO[course.track];
  const totalLessons = course.modules.reduce(
    (sum, m) => sum + m.lessons.length,
    0
  );
  const progress = MOCK_PROGRESS[course.id];

  const firstLessonId = course.modules[0]?.lessons[0]?.id;

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section
        className="border-b border-border/40"
        style={{
          background: `linear-gradient(135deg, ${trackInfo.color}10, transparent)`,
        }}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
            <Link href="/courses" className="hover:text-foreground transition-colors flex items-center gap-1">
              <ArrowLeft className="h-4 w-4" />
              Quests
            </Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-foreground">{course.title}</span>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Course Info */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">{trackInfo.icon}</span>
                <Badge variant="outline" className="text-xs">
                  {trackInfo.name}
                </Badge>
                <Badge
                  variant="secondary"
                  className="text-xs"
                  style={{
                    backgroundColor: `${diffConfig.color}20`,
                    color: diffConfig.color,
                  }}
                >
                  {diffConfig.icon} {diffConfig.label}
                </Badge>
              </div>

              <h1 className="text-3xl sm:text-4xl font-bold mb-4">
                {course.title}
              </h1>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                {course.description}
              </p>

              {/* Meta */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {course.duration}
                </span>
                <span className="flex items-center gap-1">
                  <BookOpen className="h-4 w-4" />
                  {totalLessons} lessons
                </span>
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {course.enrollmentCount.toLocaleString()} enrolled
                </span>
                <span className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-quest-gold fill-quest-gold" />
                  {course.rating}
                </span>
                <span className="flex items-center gap-1">
                  <Zap className="h-4 w-4 text-quest-gold" />
                  {course.totalXP.toLocaleString()} XP
                </span>
              </div>

              {/* Instructor */}
              <div className="flex items-center gap-3 mt-6 pt-6 border-t border-border/50">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {course.instructor.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{course.instructor.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {course.instructor.title}
                  </p>
                </div>
              </div>
            </div>

            {/* Sidebar Card */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24 border-border/50">
                <CardContent className="p-6">
                  {/* Course thumbnail */}
                  <div
                    className="h-40 rounded-lg mb-6 flex items-center justify-center"
                    style={{
                      background: `linear-gradient(135deg, ${trackInfo.color}25, ${trackInfo.color}08)`,
                    }}
                  >
                    <span className="text-6xl">{trackInfo.icon}</span>
                  </div>

                  {/* Progress (if enrolled) */}
                  {progress && (
                    <div className="mb-6">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="font-medium">Your Progress</span>
                        <span className="text-muted-foreground">
                          {progress.completionPercentage}%
                        </span>
                      </div>
                      <Progress value={progress.completionPercentage} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-2">
                        {progress.completedLessons.length} of {totalLessons} lessons
                        completed
                      </p>
                    </div>
                  )}

                  {/* CTA */}
                  <Link
                    href={`/courses/${course.slug}/lessons/${firstLessonId}`}
                  >
                    <Button className="w-full gap-2 bg-gradient-to-r from-[#9945FF] to-[#14F195] text-white hover:opacity-90 border-0 mb-4">
                      <PlayCircle className="h-4 w-4" />
                      {progress ? 'Continue Quest' : 'Start Quest'}
                    </Button>
                  </Link>

                  {/* XP info */}
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Total XP</span>
                      <span className="flex items-center gap-1 font-medium">
                        <Zap className="h-3 w-3 text-quest-gold" />
                        {course.totalXP.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Chapters</span>
                      <span className="font-medium">{course.modules.length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Lessons</span>
                      <span className="font-medium">{totalLessons}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Duration</span>
                      <span className="font-medium">{course.duration}</span>
                    </div>
                  </div>

                  {/* Prerequisites */}
                  {course.prerequisites.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-border/50">
                      <p className="text-sm font-medium mb-2 flex items-center gap-1">
                        <Lock className="h-3 w-3" />
                        Prerequisites
                      </p>
                      <div className="space-y-1">
                        {course.prerequisites.map((prereq) => {
                          const prereqCourse = MOCK_COURSES.find(
                            (c) => c.slug === prereq
                          );
                          return (
                            <Link
                              key={prereq}
                              href={`/courses/${prereq}`}
                              className="block text-sm text-primary hover:underline"
                            >
                              {prereqCourse?.title || prereq}
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Tags */}
                  <div className="mt-4 pt-4 border-t border-border/50">
                    <div className="flex flex-wrap gap-1">
                      {course.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Module List */}
      <section className="py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="lg:max-w-2xl">
            <h2 className="text-xl font-bold mb-6">Quest Chapters</h2>

            <Accordion type="multiple" defaultValue={['mod-0']} className="space-y-3">
              {course.modules.map((module, moduleIndex) => {
                const moduleComplete =
                  progress &&
                  module.lessons.every((_, i) => {
                    const globalIdx =
                      course.modules
                        .slice(0, moduleIndex)
                        .reduce((s, m) => s + m.lessons.length, 0) + i;
                    return progress.completedLessons.includes(globalIdx);
                  });

                return (
                  <AccordionItem
                    key={module.id}
                    value={`mod-${moduleIndex}`}
                    className="border border-border/50 rounded-lg px-4"
                  >
                    <AccordionTrigger className="hover:no-underline py-4">
                      <div className="flex items-center gap-3 text-left">
                        <div
                          className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                            moduleComplete
                              ? 'bg-quest-health/20 text-quest-health'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {moduleComplete ? (
                            <CheckCircle2 className="h-4 w-4" />
                          ) : (
                            moduleIndex + 1
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{module.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {module.lessons.length} lessons &bull;{' '}
                            <span className="text-quest-gold">
                              {module.xpReward} XP
                            </span>
                          </p>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-1 pb-2">
                        {module.lessons.map((lesson, lessonIndex) => {
                          const globalIdx =
                            course.modules
                              .slice(0, moduleIndex)
                              .reduce((s, m) => s + m.lessons.length, 0) +
                            lessonIndex;
                          const isComplete = progress?.completedLessons.includes(globalIdx);
                          const Icon = lessonIcons[lesson.type];

                          return (
                            <Link
                              key={lesson.id}
                              href={`/courses/${course.slug}/lessons/${lesson.id}`}
                            >
                              <div
                                className={`flex items-center gap-3 p-3 rounded-lg transition-colors hover:bg-muted/50 ${
                                  isComplete ? 'opacity-60' : ''
                                }`}
                              >
                                <div
                                  className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                                    isComplete
                                      ? 'bg-quest-health/10 text-quest-health'
                                      : lesson.type === 'challenge'
                                      ? 'bg-quest-purple/10 text-quest-purple'
                                      : 'bg-muted text-muted-foreground'
                                  }`}
                                >
                                  {isComplete ? (
                                    <CheckCircle2 className="h-4 w-4" />
                                  ) : (
                                    <Icon className="h-4 w-4" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">
                                    {lesson.title}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {lesson.duration} &bull;{' '}
                                    {lesson.type === 'challenge'
                                      ? 'Boss Battle'
                                      : lesson.type.charAt(0).toUpperCase() +
                                        lesson.type.slice(1)}
                                  </p>
                                </div>
                                <div className="flex items-center gap-1 text-xs text-quest-gold">
                                  <Zap className="h-3 w-3" />
                                  {lesson.xpReward}
                                </div>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </div>
        </div>
      </section>
    </div>
  );
}
