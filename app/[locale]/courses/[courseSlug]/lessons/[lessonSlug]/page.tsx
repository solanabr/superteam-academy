import { Link, redirect } from '@/i18n/routing';
import { courseService } from '@/lib/services/course.service';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle, 
  Play, 
  FileText, 
  Code, 
  HelpCircle, 
  ArrowLeft, 
  Star, 
  Clock,
  Trophy,
  BookOpen
} from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { cn } from '@/lib/utils';
import { CodeEditor } from '@/components/editor/code-editor';

interface LessonPageProps {
  params: Promise<{ locale: string; courseSlug: string; lessonSlug: string }>;
}

export default async function LessonPage({ params }: LessonPageProps) {
  const { locale, courseSlug, lessonSlug } = await params;
  
  const course = await courseService.getCourseBySlug(courseSlug);
  if (!course) {
    redirect({ href: '/courses', locale });
    return null;
  }

  const lessons = await courseService.getCourseLessons(course.id);
  // The route uses [lessonSlug], but current implementation might be passing ID or slug
  // We'll try to find by slug first, then ID as fallback for backward compatibility
  let lesson: any = lessons.find(l => l.slug === lessonSlug || l.id === lessonSlug);
  
  if (!lesson) {
    // Try fetching directly from service if not found in course lessons
    const lessonResult = await courseService.getLessonBySlug(courseSlug, lessonSlug);
    lesson = lessonResult || undefined;
  }
  
  if (!lesson) {
    redirect({ href: `/courses/${courseSlug}`, locale });
    return null;
  }

  const currentIndex = lessons.findIndex(l => l.id === lesson!.id);
  const prevLesson = currentIndex > 0 ? lessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < lessons.length - 1 ? lessons[currentIndex + 1] : null;

  const t = await getTranslations('Lesson');
  const ct = await getTranslations('Course');

  const isCourseCompleted = currentIndex === lessons.length - 1;

  const lessonIcons = {
    video: <Play className="h-4 w-4" />,
    reading: <FileText className="h-4 w-4" />,
    coding: <Code className="h-4 w-4" />,
    quiz: <HelpCircle className="h-4 w-4" />,
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Navigation Bar */}
      <div className="sticky top-0 z-40 w-full border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="container h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-primary">
              <Link href={`/courses/${course.slug}` as any}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">{ct('backToCourses')}</span>
              </Link>
            </Button>
            <div className="h-6 w-px bg-border/50" />
            <div className="flex flex-col">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{course.title}</span>
              <span className="text-sm font-bold truncate max-w-[200px] sm:max-w-md">{lesson.title}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20">
              <Star className="h-3.5 w-3.5 fill-accent text-accent" />
              <span className="text-xs font-bold text-accent">{lesson.xp_reward || 50} XP</span>
            </div>
            {isCourseCompleted ? (
              <Button size="sm" className="font-bold shadow-lg shadow-accent/20 bg-accent hover:bg-accent/90 text-accent-foreground">
                <CheckCircle className="mr-2 h-4 w-4" />
                {t('completeCourse')}
              </Button>
            ) : (
              <Button size="sm" className="font-bold shadow-lg shadow-primary/20" asChild>
                <Link href={`/courses/${course.slug}/lessons/${nextLesson?.slug || nextLesson?.id}` as any}>
                  {t('next')}
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 container py-8">
        <div className="grid gap-8 lg:grid-cols-4">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="capitalize bg-primary/5 border-primary/20 text-primary flex items-center gap-1.5 py-1 px-3">
                  {lessonIcons[lesson.lesson_type as keyof typeof lessonIcons]}
                  {lesson.lesson_type}
                </Badge>
                {lesson.duration_minutes && (
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{lesson.duration_minutes}m</span>
                  </div>
                )}
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">{lesson.title}</h1>
              <p className="text-lg text-muted-foreground leading-relaxed">{lesson.description}</p>
            </div>

            {/* Lesson Content Area */}
            <Card className="border-border/50 bg-card/30 backdrop-blur-sm overflow-hidden shadow-2xl">
              <CardContent className="p-0">
                {lesson.lesson_type === 'video' ? (
                  <div className="aspect-video relative group">
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/20 transition-all cursor-pointer">
                      <div className="h-20 w-20 rounded-full bg-primary/90 flex items-center justify-center shadow-[0_0_30px_rgba(20,241,149,0.4)] group-hover:scale-110 transition-transform">
                        <Play className="h-10 w-10 text-primary-foreground fill-current ml-1" />
                      </div>
                    </div>
                    {/* Background placeholder */}
                    <div className="w-full h-full bg-gradient-to-br from-muted to-background flex items-center justify-center p-12 text-center">
                      <div className="space-y-4">
                        <p className="text-xl font-bold text-muted-foreground">{t('videoPlayer')}</p>
                        <p className="text-sm text-muted-foreground/60">{t('placeholderContent')}</p>
                      </div>
                    </div>
                  </div>
                ) : lesson.lesson_type === 'coding' ? (
                  <div className="min-h-[600px] flex flex-col">
                    <CodeEditor 
                      initialCode={lesson.starter_code || '// Write your Solana Rust code here\n\nuse anchor_lang::prelude::*;\n\ndeclare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");\n\n#[program]\npub mod hello_solana {\n    use super::*;\n    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {\n        msg!("Hello, Solana!");\n        Ok(())\n    }\n}\n\n#[derive(Accounts)]\npub struct Initialize {}\n'}
                      language="rust"
                    />
                  </div>
                ) : (
                  <div className="prose prose-neutral dark:prose-invert max-w-none p-8 md:p-12">
                    <div className="space-y-6">
                      <div className="text-lg leading-relaxed" dangerouslySetInnerHTML={{ __html: lesson.content }} />
                      <div className="grid gap-6 sm:grid-cols-2">
                        <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                          <h3 className="text-primary font-bold mb-3 flex items-center gap-2">
                            <Star className="h-4 w-4" /> Key Takeaways
                          </h3>
                          <ul className="space-y-2 text-sm text-muted-foreground list-disc list-inside">
                            <li>Understanding the Solana programming model</li>
                            <li>Efficient data handling with PDA</li>
                            <li>Security best practices for smart contracts</li>
                          </ul>
                        </div>
                        <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                          <h3 className="text-accent font-bold mb-3 flex items-center gap-2">
                            <Trophy className="h-4 w-4" /> Recommended Tools
                          </h3>
                          <ul className="space-y-2 text-sm text-muted-foreground list-disc list-inside">
                            <li>Anchor Framework</li>
                            <li>Solana CLI & Toolsuite</li>
                            <li>Helius for RPC nodes</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between gap-4 pt-4">
              {prevLesson ? (
                <Button variant="outline" size="lg" className="rounded-xl border-border/50 hover:bg-muted/50" asChild>
                  <Link href={`/courses/${course.slug}/lessons/${prevLesson.slug || prevLesson.id}` as any}>
                    <ChevronLeft className="mr-2 h-5 w-5" />
                    {t('previous')}
                  </Link>
                </Button>
              ) : (
                <div />
              )}
              {nextLesson ? (
                <Button size="lg" className="rounded-xl font-bold shadow-xl shadow-primary/20" asChild>
                  <Link href={`/courses/${course.slug}/lessons/${nextLesson.slug || nextLesson.id}` as any}>
                    {t('next')}
                    <ChevronRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              ) : (
                <Button size="lg" className="rounded-xl font-bold shadow-xl shadow-accent/20 bg-accent hover:bg-accent/90 text-accent-foreground">
                  <CheckCircle className="mr-2 h-5 w-5" />
                  {t('completeCourse')}
                </Button>
              )}
            </div>
          </div>

          {/* Sidebar - Course Progress */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24 border-border/50 bg-card/30 backdrop-blur-sm overflow-hidden">
              <div className="p-6 border-b border-border/50 bg-white/5">
                <h3 className="font-bold flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-primary" />
                  {t('courseLessons')}
                </h3>
                <div className="mt-4 h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary shadow-[0_0_10px_rgba(20,241,149,0.5)] transition-all duration-500" 
                    style={{ width: `${Math.round(((currentIndex + 1) / lessons.length) * 100)}%` }} 
                  />
                </div>
                <p className="mt-2 text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
                  Progress: {currentIndex + 1} / {lessons.length}
                </p>
              </div>
              <CardContent className="p-2">
                <div className="space-y-1">
                  {lessons.map((l, index) => {
                    const isActive = l.id === lesson!.id;
                    const isCompleted = index < currentIndex;
                    
                    return (
                      <Link
                        key={l.id}
                        href={`/courses/${course.slug}/lessons/${l.slug || l.id}` as any}
                        className={cn(
                          "group relative flex items-center gap-3 rounded-xl p-3 text-sm transition-all",
                          isActive 
                            ? "bg-primary/10 text-primary border border-primary/20" 
                            : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <div className={cn(
                          "flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold transition-colors",
                          isActive 
                            ? "bg-primary text-primary-foreground" 
                            : isCompleted 
                              ? "bg-primary/20 text-primary"
                              : "bg-muted text-muted-foreground group-hover:bg-muted-foreground group-hover:text-background"
                        )}>
                          {isCompleted ? <CheckCircle className="h-3 w-3" /> : index + 1}
                        </div>
                        <span className={cn(
                          "font-medium line-clamp-1 flex-1",
                          isActive && "font-bold"
                        )}>{l.title}</span>
                        {lessonIcons[l.lesson_type as keyof typeof lessonIcons] && (
                          <div className="opacity-40 group-hover:opacity-100 transition-opacity">
                            {lessonIcons[l.lesson_type as keyof typeof lessonIcons]}
                          </div>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

