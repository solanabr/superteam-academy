"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Code2,
  Clock,
  Users,
  Star,
  ChevronRight,
  ChevronDown,
  BookOpen,
  Zap,
  CheckCircle,
  Circle,
  PlayCircle,
  FileCode,
  Trophy,
  Share2,
  Bookmark,
  Loader2
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { getCourseBySlug } from "@/lib/data/courses";
import type { Course, LessonReference } from "@/lib/sanity/types";
import { Header } from "@/components/navigation/Header";

const lessonTypeIcons = {
  video: PlayCircle,
  article: BookOpen,
  code: FileCode,
  quiz: Zap,
  project: Trophy
};

const levelConfig = {
  beginner: { color: "bg-green-500", textColor: "text-green-500" },
  intermediate: { color: "bg-yellow-500", textColor: "text-yellow-500" },
  advanced: { color: "bg-red-500", textColor: "text-red-500" }
};

// Extended course type with mock module structure
interface ModuleLesson {
  id: string;
  title: string;
  duration: string;
  type: string;
  completed: boolean;
}

interface Module {
  id: string;
  title: string;
  lessons: ModuleLesson[];
}

// Transform flat lessons into modules for display
function transformToModules(lessons: LessonReference[] | undefined): Module[] {
  if (!lessons || lessons.length === 0) {
    return [
      {
        id: "mod-1",
        title: "Introduction",
        lessons: [
          { id: "les-1", title: "Getting Started", duration: "10 min", type: "video", completed: false }
        ]
      }
    ];
  }

  // Group lessons into modules of 3-4 lessons each
  const modulesCount = Math.ceil(lessons.length / 3);
  const modules: Module[] = [];

  for (let i = 0; i < modulesCount; i++) {
    const startIdx = i * 3;
    const endIdx = Math.min(startIdx + 3, lessons.length);
    const moduleLessons = lessons.slice(startIdx, endIdx);

    modules.push({
      id: `mod-${i + 1}`,
      title: `Module ${i + 1}`,
      lessons: moduleLessons.map((lesson, idx) => ({
        id: lesson._id,
        title: lesson.title,
        duration: lesson.duration || "15 min",
        type: idx === 0 ? "video" : idx === 1 ? "code" : "article",
        completed: false
      }))
    });
  }

  return modules;
}

export default function CourseDetailPage() {
  const params = useParams();
  const t = useTranslations("courseDetail");
  const tCourses = useTranslations("courses");
  const slug = params.slug as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedModules, setExpandedModules] = useState<string[]>(["mod-1"]);

  useEffect(() => {
    const loadCourse = async () => {
      setLoading(true);
      const data = await getCourseBySlug(slug);
      setCourse(data);
      setLoading(false);
    };
    loadCourse();
  }, [slug]);

  const toggleModule = (moduleId: string) => {
    setExpandedModules(prev =>
      prev.includes(moduleId)
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <Card className="p-8 text-center">
            <h2 className="text-xl font-semibold mb-2">{t("notFound.title")}</h2>
            <p className="text-muted-foreground mb-4">{t("notFound.description")}</p>
            <Button asChild>
              <Link href="/courses">{t("notFound.backToCourses")}</Link>
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  const modules = transformToModules(course.lessons);
  const totalLessons = modules.reduce((acc, m) => acc + m.lessons.length, 0);
  const completedLessons = modules.flatMap(m => m.lessons).filter(l => l.completed).length;
  const progress = Math.round((completedLessons / totalLessons) * 100);
  const level = levelConfig[course.level as keyof typeof levelConfig];
  const courseSlug = typeof course.slug === 'string' ? course.slug : course.slug.current;

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      {/* Course Header */}
      <section className="border-b bg-muted/30">
        <div className="container py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Course Info */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-4">
                <Link href="/courses" className="text-sm text-muted-foreground hover:text-foreground">
                  {t("breadcrumb.courses")}
                </Link>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{course.title}</span>
              </div>

              <div className="flex items-center gap-2 mb-4">
                <Badge className={level.color}>{tCourses(`levels.${course.level}`)}</Badge>
                {course.tags?.slice(0, 3).map(tag => (
                  <Badge key={tag} variant="secondary">{tag}</Badge>
                ))}
              </div>

              <h1 className="text-3xl md:text-4xl font-bold mb-4">{course.title}</h1>
              <p className="text-muted-foreground mb-6 max-w-2xl">{course.description}</p>

              <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground mb-6">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {course.duration}
                </div>
                <div className="flex items-center gap-1">
                  <BookOpen className="h-4 w-4" />
                  {course.lessonsCount || totalLessons} {t("lessons")}
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {course.studentsCount?.toLocaleString()} {t("enrolled")}
                </div>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                  {course.rating}
                </div>
                <div className="flex items-center gap-1">
                  <Zap className="h-4 w-4 text-yellow-500" />
                  {course.xpReward} XP
                </div>
              </div>

              <div className="flex items-center gap-4">
                <Button size="lg" className="gap-2">
                  <PlayCircle className="h-5 w-5" />
                  {t("continueLearning")}
                </Button>
                <Button variant="outline" size="lg">
                  <Bookmark className="h-5 w-5" />
                </Button>
                <Button variant="outline" size="lg">
                  <Share2 className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Progress Card */}
            <Card className="lg:w-80 shrink-0">
              <CardHeader>
                <CardTitle className="text-lg">{t("progress.title")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span>{completedLessons} {t("progress.of")} {totalLessons} {t("lessons")}</span>
                    <span className="font-medium">{progress}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("progress.xpEarned")}</span>
                    <span className="font-medium flex items-center gap-1">
                      <Zap className="h-4 w-4 text-yellow-500" />
                      {Math.round(course.xpReward * (progress / 100))} / {course.xpReward}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("progress.timeSpent")}</span>
                    <span className="font-medium">0 min</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("progress.streak")}</span>
                    <span className="font-medium">0 {t("progress.days")}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Course Content */}
      <main className="container py-8 flex-1">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Curriculum */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="curriculum">
              <TabsList className="mb-6">
                <TabsTrigger value="curriculum">{t("tabs.curriculum")}</TabsTrigger>
                <TabsTrigger value="overview">{t("tabs.overview")}</TabsTrigger>
                <TabsTrigger value="reviews">{t("tabs.reviews")}</TabsTrigger>
              </TabsList>

              <TabsContent value="curriculum" className="space-y-4">
                {modules.map((module, moduleIndex) => {
                  const isExpanded = expandedModules.includes(module.id);
                  const moduleCompleted = module.lessons.filter(l => l.completed).length;

                  return (
                    <Card key={module.id}>
                      <button
                        className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors rounded-t-lg"
                        onClick={() => toggleModule(module.id)}
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-medium">
                            {moduleIndex + 1}
                          </div>
                          <div className="text-left">
                            <h3 className="font-medium">{module.title}</h3>
                            <p className="text-sm text-muted-foreground">
                              {moduleCompleted}/{module.lessons.length} {t("lessonsCompleted")}
                            </p>
                          </div>
                        </div>
                        <ChevronDown
                          className={`h-5 w-5 text-muted-foreground transition-transform ${isExpanded ? "rotate-180" : ""}`}
                        />
                      </button>

                      {isExpanded && (
                        <CardContent className="pt-0">
                          <div className="space-y-1 border-t pt-4">
                            {module.lessons.map((lesson) => {
                              const LessonIcon = lessonTypeIcons[lesson.type as keyof typeof lessonTypeIcons] || BookOpen;
                              return (
                                <Link
                                  key={lesson.id}
                                  href={`/courses/${courseSlug}/${lesson.id}`}
                                  className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors group"
                                >
                                  <div className="flex items-center justify-center w-8 h-8">
                                    {lesson.completed ? (
                                      <CheckCircle className="h-5 w-5 text-green-500" />
                                    ) : (
                                      <Circle className="h-5 w-5 text-muted-foreground" />
                                    )}
                                  </div>
                                  <div className="flex-1">
                                    <h4 className="text-sm font-medium group-hover:text-primary transition-colors">
                                      {lesson.title}
                                    </h4>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                      <LessonIcon className="h-3 w-3" />
                                      <span>{lesson.type}</span>
                                      <span>•</span>
                                      <span>{lesson.duration}</span>
                                    </div>
                                  </div>
                                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                                </Link>
                              );
                            })}
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  );
                })}
              </TabsContent>

              <TabsContent value="overview">
                <Card>
                  <CardHeader>
                    <CardTitle>{t("whatYouWillLearn")}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="grid md:grid-cols-2 gap-3">
                      {(course.whatYouWillLearn || [
                        "Understand core concepts and fundamentals",
                        "Build practical skills through hands-on exercises",
                        "Complete real-world projects",
                        "Earn verifiable on-chain credentials"
                      ]).map((item, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                          <span className="text-sm">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="reviews">
                <Card className="p-6 text-center text-muted-foreground">
                  <Star className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
                  <p>{t("reviewsComingSoon")}</p>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Instructor Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t("instructor.title")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Code2 className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{course.instructor}</p>
                    <p className="text-sm text-muted-foreground">
                      6 {t("instructor.courses")}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Certificate Card */}
            <Card className="border-primary/30 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  {t("credential.title")}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <p>{t("credential.description")}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Code2 className="h-5 w-5 text-primary" />
            <span className="font-semibold">Superteam Academy</span>
          </div>
          <p className="text-sm text-muted-foreground">
            {tCourses("footer.builtBy")}
          </p>
        </div>
      </footer>
    </div>
  );
}
