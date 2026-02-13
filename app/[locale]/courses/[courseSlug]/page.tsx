import { Link, redirect } from '@/i18n/routing';
import Image from 'next/image';
import { courseService } from '@/lib/services/course.service';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, BookOpen, Award, CheckCircle2, ArrowRight, Star, Trophy, PlayCircle } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

interface CoursePageProps {
  params: Promise<{ locale: string; courseSlug: string }>;
}

export default async function CoursePage({ params }: CoursePageProps) {
  const { locale, courseSlug } = await params;
  const course = await courseService.getCourseBySlug(courseSlug);
  const t = await getTranslations('Course');

  if (!course) {
    redirect({ href: '/courses', locale });
    return null;
  }

  let lessons = await courseService.getCourseLessons(course.id);
  if (!lessons || lessons.length === 0) {
    lessons = await courseService.getCourseLessonsBySlug(course.slug);
  }
  const firstLesson = lessons[0];
  const firstLessonLink = firstLesson ? `/courses/${course.slug}/lessons/${firstLesson.slug || firstLesson.id}` : '#';

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-border/50 bg-card/30 backdrop-blur-sm pt-16 pb-24">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px] -z-10" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-[120px] -z-10" />

        <div className="container">
          <Link 
            href="/courses" 
            className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors mb-8"
          >
            <ArrowRight className="mr-2 h-4 w-4 rotate-180" />
            {t('backToCourses')}
          </Link>

          <div className="grid gap-12 lg:grid-cols-2 items-center">
            <div className="space-y-8">
              <div className="flex flex-wrap gap-3">
                {course.difficulty && (
                  <Badge variant="outline" className="capitalize border-primary/20 bg-primary/5 text-primary">
                    {course.difficulty}
                  </Badge>
                )}
                {course.category && (
                  <Badge variant="secondary" className="capitalize bg-accent/10 text-accent border-accent/20">
                    {course.category}
                  </Badge>
                )}
              </div>

              <div className="space-y-4">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight gradient-text">
                  {course.title}
                </h1>
                <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl">
                  {course.description}
                </p>
              </div>

              <div className="flex flex-wrap gap-8 text-sm font-medium">
                {course.duration_minutes && (
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                      <Clock className="h-4 w-4 text-primary" />
                    </div>
                    <span>{Math.round(course.duration_minutes / 60)} {t('hours')}</span>
                  </div>
                )}
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                    <BookOpen className="h-4 w-4 text-primary" />
                  </div>
                  <span>{lessons.length} {t('lessons')}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                    <Trophy className="h-4 w-4 text-accent" />
                  </div>
                  <span className="text-accent">{t('certificate')}</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button size="lg" className="h-14 px-8 text-lg font-bold rounded-xl shadow-[0_0_20px_rgba(20,241,149,0.2)] hover:shadow-[0_0_30px_rgba(20,241,149,0.3)] transition-all" asChild>
                  <Link href={firstLessonLink as any}>
                    {t('startCourse')}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <div className="flex items-center gap-4 px-6 py-3 rounded-xl bg-card/50 border border-border/50 backdrop-blur-md">
                  <div className="flex items-center gap-1.5">
                    <Star className="h-5 w-5 fill-accent text-accent" />
                    <span className="font-bold text-lg">{course.xp_reward || 500}</span>
                    <span className="text-muted-foreground text-sm">{t('xp')}</span>
                  </div>
                  <div className="w-px h-6 bg-border/50" />
                  <div className="flex items-center gap-1.5">
                    <Award className="h-5 w-5 text-primary" />
                    <span className="font-bold text-sm text-primary">{t('cnft')}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary to-accent rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200" />
              <div className="relative aspect-video overflow-hidden rounded-2xl border border-white/10 bg-black shadow-2xl">
                {course.thumbnail_url ? (
                  <Image
                    src={course.thumbnail_url}
                    alt={course.title}
                    fill
                    className="object-cover transition duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center bg-muted/20">
                    <PlayCircle className="h-20 w-20 text-primary/40" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="container py-20">
        <div className="grid gap-12 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-12">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="h-8 w-1.5 rounded-full bg-primary" />
                <h2 className="text-3xl font-bold tracking-tight">{t('curriculum')}</h2>
              </div>
              
              <div className="grid gap-4">
                {lessons.length > 0 ? (
                  lessons.map((lesson, index) => (
                    <Link
                      key={lesson.id}
                      href={`/courses/${course.slug}/lessons/${lesson.slug || lesson.id}` as any}
                      className="group flex items-center gap-6 rounded-2xl border border-border/50 bg-card/30 p-5 transition-all hover:bg-card/50 hover:border-primary/30 hover:shadow-lg"
                    >
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-lg font-bold text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                        {index + 1}
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="font-bold text-lg group-hover:text-primary transition-colors">{lesson.title}</p>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {lesson.description}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        {lesson.duration_minutes && (
                          <span className="text-sm font-medium text-muted-foreground">{lesson.duration_minutes}m</span>
                        )}
                        <Badge variant="outline" className="capitalize bg-white/5 border-white/10">
                          {lesson.lesson_type}
                        </Badge>
                        <div className="h-8 w-8 flex items-center justify-center rounded-full bg-muted/50 group-hover:bg-primary/20 group-hover:text-primary transition-all">
                          <PlayCircle className="h-5 w-5" />
                        </div>
                      </div>
                    </Link>
                  ))
                ) : (
                  <Card className="border-dashed bg-transparent">
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                      <BookOpen className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
                      <p className="text-muted-foreground font-medium">No lessons available yet</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <Card className="border-border/50 bg-card/30 backdrop-blur-sm overflow-hidden">
              <CardHeader className="border-b border-border/50 bg-white/5">
                <CardTitle className="text-xl flex items-center gap-2">
                  <Star className="h-5 w-5 text-primary" />
                  {t('whatYouWillLearn')}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <ul className="space-y-4">
                  {[
                    t('learnFundamentals'),
                    t('learnSmartContracts'),
                    t('learnWeb3'),
                    t('learnDApps'),
                    t('learnSecurity')
                  ].map((item, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className="mt-1 p-0.5 rounded-full bg-primary/20">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-sm leading-relaxed text-muted-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* CTA Card */}
            <Card className="relative overflow-hidden border-primary/20 bg-primary/5">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Trophy className="h-24 w-24 text-primary rotate-12" />
              </div>
              <CardContent className="p-8 space-y-4">
                <h3 className="text-xl font-bold">{t('enrollNow')}</h3>
                <p className="text-sm text-muted-foreground">
                  {t('enrollDescription')}
                </p>
                <Button className="w-full font-bold shadow-lg shadow-primary/20" asChild>
                  <Link href={firstLessonLink as any}>
                    {t('startCourse')}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
