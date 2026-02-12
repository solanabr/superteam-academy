'use client';

import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  BookOpen,
  Clock,
  Zap,
  Users,
  Star,
  CheckCircle2,
  Circle,
  FileText,
  Video,
  Code2,
  HelpCircle,
  Share2,
  ArrowLeft,
  GraduationCap,
  BarChart3,
  Trophy,
} from 'lucide-react';
import { courses, type Difficulty, type LessonType } from '@/lib/mock-data';

const difficultyColors: Record<Difficulty, string> = {
  beginner: 'bg-green-500/10 text-green-500 border-green-500/20',
  intermediate: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  advanced: 'bg-red-500/10 text-red-500 border-red-500/20',
};

const lessonIcons: Record<LessonType, typeof FileText> = {
  text: FileText,
  video: Video,
  challenge: Code2,
  quiz: HelpCircle,
};

const lessonEmojis: Record<LessonType, string> = {
  text: '📝',
  video: '🎥',
  challenge: '💻',
  quiz: '❓',
};

export default function CourseDetailPage() {
  const t = useTranslations('courseDetail');
  const tCourses = useTranslations('courses');
  const params = useParams();
  const slug = params.slug as string;

  const course = courses.find((c) => c.slug === slug);

  if (!course) {
    return (
      <div className="container flex flex-col items-center justify-center gap-4 py-20">
        <h1 className="text-2xl font-bold">{t('notFound')}</h1>
        <Link href="/courses">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            {t('backToCourses')}
          </Button>
        </Link>
      </div>
    );
  }

  const completedLessons = course.modules.reduce(
    (acc, mod) => acc + mod.lessons.filter((l) => l.completed).length,
    0
  );
  const totalLessons = course.modules.reduce((acc, mod) => acc + mod.lessons.length, 0);

  return (
    <div className="flex flex-col pb-20">
      {/* Course Header */}
      <section className="relative overflow-hidden border-b">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-solana-purple/10 via-background to-solana-green/5" />
        <div className="container py-12 md:py-16">
          <Link href="/courses" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            {t('backToCourses')}
          </Link>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Main Info */}
            <div className="flex flex-col gap-4 lg:col-span-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className={difficultyColors[course.difficulty]}>
                  {tCourses(`filters.${course.difficulty}`)}
                </Badge>
                {course.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>

              <h1 className="text-3xl font-bold md:text-4xl">{course.title}</h1>
              <p className="text-lg text-muted-foreground">{course.longDescription}</p>

              <div className="flex items-center gap-4">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {course.instructor.name.split(' ').map((n) => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{course.instructor.name}</p>
                  <p className="text-xs text-muted-foreground">{course.instructor.bio}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                  {course.rating}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {course.studentCount.toLocaleString()} {t('students')}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {Math.round(course.duration / 60)}h
                </span>
                <span className="flex items-center gap-1">
                  <BookOpen className="h-4 w-4" />
                  {course.lessonCount} {tCourses('card.lessons')}
                </span>
                <span className="flex items-center gap-1 text-primary font-medium">
                  <Zap className="h-4 w-4" />
                  {course.xp} XP
                </span>
              </div>

              {/* Progress bar if enrolled */}
              {course.enrolled && (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t('progress')}</span>
                    <span className="font-medium">{course.progress}%</span>
                  </div>
                  <Progress value={course.progress} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    {completedLessons}/{totalLessons} {tCourses('card.lessons')}
                  </p>
                </div>
              )}
            </div>

            {/* Sidebar Card */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24">
                <CardContent className="flex flex-col gap-4 p-6">
                  {/* Thumbnail */}
                  <div className="flex h-40 items-center justify-center rounded-lg bg-gradient-to-br from-solana-purple/20 to-solana-green/10">
                    <GraduationCap className="h-16 w-16 text-primary/30" />
                  </div>

                  {course.enrolled ? (
                    <Button variant="solana" size="lg" className="w-full gap-2">
                      {tCourses('card.continue')}
                    </Button>
                  ) : (
                    <Button variant="solana" size="lg" className="w-full gap-2">
                      <Zap className="h-5 w-5" />
                      {t('enrollNow')}
                    </Button>
                  )}

                  <Separator />

                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <BarChart3 className="h-4 w-4" />
                        {t('difficulty')}
                      </span>
                      <span className="font-medium capitalize">{tCourses(`filters.${course.difficulty}`)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {t('duration')}
                      </span>
                      <span className="font-medium">{Math.round(course.duration / 60)}h</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <BookOpen className="h-4 w-4" />
                        {t('lessons')}
                      </span>
                      <span className="font-medium">{course.lessonCount}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <Trophy className="h-4 w-4" />
                        {t('totalXP')}
                      </span>
                      <span className="font-medium text-primary">{course.xp} XP</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <Users className="h-4 w-4" />
                        {t('students')}
                      </span>
                      <span className="font-medium">{course.studentCount.toLocaleString()}</span>
                    </div>
                  </div>

                  <Separator />

                  {/* Instructor */}
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/10 text-primary text-sm">
                        {course.instructor.name.split(' ').map((n) => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{course.instructor.name}</p>
                      <p className="text-xs text-muted-foreground">{t('instructor')}</p>
                    </div>
                  </div>

                  <Button variant="outline" size="sm" className="gap-2">
                    <Share2 className="h-4 w-4" />
                    {t('share')}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <div className="container grid grid-cols-1 gap-8 py-12 lg:grid-cols-3">
        <div className="flex flex-col gap-8 lg:col-span-2">
          {/* What You'll Learn */}
          <Card>
            <CardHeader>
              <CardTitle>{t('whatYoullLearn')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {course.whatYoullLearn.map((item) => (
                  <div key={item} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-solana-green" />
                    <span className="text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Prerequisites */}
          {course.prerequisites.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{t('prerequisites')}</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {course.prerequisites.map((prereq) => (
                    <li key={prereq} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <ArrowLeft className="h-3 w-3 rotate-180" />
                      {prereq}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Course Modules */}
          <Card>
            <CardHeader>
              <CardTitle>{t('courseContent')}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {course.moduleCount} {t('modules')} · {totalLessons} {tCourses('card.lessons')} · {Math.round(course.duration / 60)}h
              </p>
            </CardHeader>
            <CardContent>
              <Accordion type="multiple" defaultValue={[course.modules[0]?.id ?? '']} className="w-full">
                {course.modules.map((module, idx) => {
                  const moduleCompleted = module.lessons.filter((l) => l.completed).length;
                  const moduleTotal = module.lessons.length;

                  return (
                    <AccordionItem key={module.id} value={module.id}>
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex flex-1 items-center justify-between pr-4">
                          <div className="flex items-center gap-3">
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-medium text-primary">
                              {idx + 1}
                            </span>
                            <div className="text-left">
                              <p className="font-medium">{module.title}</p>
                              <p className="text-xs text-muted-foreground">{module.description}</p>
                            </div>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {moduleCompleted}/{moduleTotal}
                          </span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-1 pl-11">
                          {module.lessons.map((lesson) => {
                            const LessonIcon = lessonIcons[lesson.type];
                            return (
                              <Link
                                key={lesson.id}
                                href={`/courses/${slug}/lessons/${lesson.id}`}
                                className="flex items-center justify-between rounded-lg px-3 py-2.5 transition-colors hover:bg-accent/50"
                              >
                                <div className="flex items-center gap-3">
                                  {lesson.completed ? (
                                    <CheckCircle2 className="h-4 w-4 text-solana-green" />
                                  ) : (
                                    <Circle className="h-4 w-4 text-muted-foreground" />
                                  )}
                                  <span className="text-sm" title={lessonEmojis[lesson.type]}>
                                    <LessonIcon className="mr-1.5 inline h-3.5 w-3.5 text-muted-foreground" />
                                    {lesson.title}
                                  </span>
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  {lesson.duration} min
                                </span>
                              </Link>
                            );
                          })}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </CardContent>
          </Card>

          {/* Reviews Placeholder */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {t('reviews')}
                <Badge variant="secondary">{t('comingSoon')}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{t('reviewsPlaceholder')}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
