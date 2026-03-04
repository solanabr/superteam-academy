"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useQuery } from "@tanstack/react-query";
import {
  Clock,
  BookOpen,
  Trophy,
  ChevronDown,
  Play,
  CheckCircle,
  Lock,
  Star,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { courseService, learningProgressService } from "@/services";
import { formatDuration, formatXP } from "@/lib/utils";
import type { Course, Progress as ProgressType } from "@/types";

interface CourseDetailProps {
  slug: string;
}

export function CourseDetail({ slug }: CourseDetailProps) {
  const t = useTranslations("course");
  const tTracks = useTranslations("courses.tracks");
  const { publicKey, connected } = useWallet();
  const { setVisible } = useWalletModal();

  const { data: courseData, isLoading: courseLoading } = useQuery({
    queryKey: ["course", slug],
    queryFn: () => courseService.getCourseBySlug(slug),
  });

  const { data: progressData } = useQuery({
    queryKey: ["progress", slug, publicKey?.toBase58()],
    queryFn: () => learningProgressService.getCourseProgress(slug, "user-wallet"),
    enabled: connected,
  });

  const course = courseData;
  const progress = progressData?.data;

  const handleEnroll = async () => {
    if (!connected) {
      setVisible(true);
      return;
    }
    // In production: call learningProgressService.startCourse(course.id)
    console.log("Enrolling in course:", slug);
  };

  if (courseLoading) {
    return (
      <div className="container px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-64 rounded-xl bg-muted" />
          <div className="h-8 w-1/2 rounded bg-muted" />
          <div className="h-4 w-3/4 rounded bg-muted" />
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="container px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">Course not found</h1>
        <p className="text-muted-foreground mt-2">
          The course you're looking for doesn't exist.
        </p>
        <Button asChild className="mt-4">
          <Link href="/courses">Browse Courses</Link>
        </Button>
      </div>
    );
  }

  const isEnrolled = progress && progress.completedLessons.length > 0;
  const completionPercent = progress
    ? Math.round((progress.completedLessons.length / course.lessonCount) * 100)
    : 0;

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-primary/10 via-background to-accent/10">
        <div className="container px-4 py-12 md:py-16">
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Course Info */}
            <div className="lg:col-span-2">
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge
                  variant={
                    [
                      "fundamentals",
                      "defi",
                      "nft",
                      "gaming",
                      "infrastructure",
                      "security",
                      "beginner",
                      "intermediate",
                      "advanced",
                      "default",
                      "destructive",
                      "outline",
                      "secondary",
                      "success",
                      "warning",
                    ].includes(course.track)
                      ? (course.track as
                          | "fundamentals"
                          | "defi"
                          | "nft"
                          | "gaming"
                          | "infrastructure"
                          | "security"
                          | "beginner"
                          | "intermediate"
                          | "advanced"
                          | "default"
                          | "destructive"
                          | "outline"
                          | "secondary"
                          | "success"
                          | "warning")
                      : "default"
                  }
                >
                  {tTracks(course.track)}
                </Badge>
                <Badge variant={course.difficulty}>{course.difficulty}</Badge>
              </div>

              <h1 className="text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
                {course.title}
              </h1>

              <p className="mt-4 text-lg text-muted-foreground">
                {course.description}
              </p>

              {/* Stats */}
              <div className="mt-6 flex flex-wrap items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-muted-foreground" />
                  <span>{t("lessons", { count: course.lessonCount })}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <span>{formatDuration(course.durationMinutes)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-xp" />
                  <span>{formatXP(course.xpReward)} XP</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 fill-yellow-500 text-yellow-500" />
                  <span>4.9 (258 reviews)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <span>2,450 enrolled</span>
                </div>
              </div>

              {/* Instructor */}
              <div className="mt-6 flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={course.instructor.avatar} />
                  <AvatarFallback>
                    {course.instructor.name
                      .split(" ")
                      .map((n: string) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{course.instructor.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {course.instructor.title || "Solana Developer"}
                  </p>
                </div>
              </div>
            </div>

            {/* Enrollment Card */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24">
                <CardContent className="p-6">
                  {/* Thumbnail */}
                  <div className="relative aspect-video overflow-hidden rounded-lg bg-muted mb-6">
                    {course.thumbnail ? (
                      <Image
                        src={course.thumbnail}
                        alt={course.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
                        <Play className="h-16 w-16 text-muted-foreground/40" />
                      </div>
                    )}
                    <button className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity">
                      <div className="rounded-full bg-white/90 p-4">
                        <Play className="h-8 w-8 text-primary fill-primary" />
                      </div>
                    </button>
                  </div>

                  {/* Progress (if enrolled) */}
                  {isEnrolled && (
                    <div className="mb-6">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-muted-foreground">
                          {completionPercent}% complete
                        </span>
                        <span className="font-medium">
                          {progress.completedLessons.length}/{course.lessonCount} lessons
                        </span>
                      </div>
                      <Progress value={completionPercent} className="h-2" />
                    </div>
                  )}

                  {/* CTA */}
                  <Button
                    size="lg"
                    className="w-full"
                    onClick={handleEnroll}
                  >
                    {isEnrolled ? (
                      <>
                        <Play className="mr-2 h-4 w-4" />
                        {t("continue")}
                      </>
                    ) : connected ? (
                      <>
                        <BookOpen className="mr-2 h-4 w-4" />
                        {t("enroll")}
                      </>
                    ) : (
                      t("connectToEnroll")
                    )}
                  </Button>

                  {/* XP Reward */}
                  <p className="text-center text-sm text-muted-foreground mt-3">
                    {t("xpReward", { xp: formatXP(course.xpReward) })}
                  </p>

                  {/* What you'll learn */}
                  <div className="mt-6 pt-6 border-t">
                    <h4 className="font-semibold mb-3">{t("whatYouLearn")}</h4>
                    <ul className="space-y-2 text-sm">
                      {(course.learningObjectives || [
                        "Understand Solana's architecture",
                        "Write programs in Rust",
                        "Use Anchor framework",
                        "Build and deploy dApps",
                      ]).map((objective: string, i: number) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-success mt-0.5 shrink-0" />
                          <span>{objective}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Course Content */}
      <div className="container px-4 py-12">
        <Tabs defaultValue="modules" className="space-y-8">
          <TabsList>
            <TabsTrigger value="modules">{t("modules")}</TabsTrigger>
            <TabsTrigger value="about">{t("about")}</TabsTrigger>
            <TabsTrigger value="reviews">{t("reviews")}</TabsTrigger>
          </TabsList>

          <TabsContent value="modules" className="space-y-4">
            <CourseModules
              course={course}
              completedLessons={progress?.completedLessons || []}
            />
          </TabsContent>

          <TabsContent value="about">
            <AboutCourse course={course} />
          </TabsContent>

          <TabsContent value="reviews">
            <CourseReviews courseId={course.id} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function CourseModules({
  course,
  completedLessons,
}: {
  course: Course;
  completedLessons: string[];
}) {
  const t = useTranslations("course");

  return (
    <Accordion type="multiple" defaultValue={["module-0"]} className="space-y-4">
      {course.modules.map((module, moduleIndex) => (
        <AccordionItem
          key={module.id}
          value={`module-${moduleIndex}`}
          className="border rounded-lg px-4"
        >
          <AccordionTrigger className="hover:no-underline py-4">
            <div className="flex items-center gap-4 text-left">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                {moduleIndex + 1}
              </div>
              <div>
                <h3 className="font-semibold">{module.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {module.lessons.length} lessons · {formatDuration(module.durationMinutes)}
                </p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-4">
            <ul className="space-y-2 pl-12">
              {module.lessons.map((lesson, lessonIndex) => {
                const isCompleted = completedLessons.includes(lesson.id);
                const isLocked = lessonIndex > 0 && !completedLessons.includes(module.lessons[lessonIndex - 1].id);

                return (
                  <li key={lesson.id}>
                    <Link
                      href={isLocked ? "#" : `/courses/${course.slug}/lessons/${lesson.id}`}
                      className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                        isLocked
                          ? "opacity-50 cursor-not-allowed"
                          : "hover:bg-muted"
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle className="h-5 w-5 text-success" />
                      ) : isLocked ? (
                        <Lock className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <Play className="h-5 w-5 text-muted-foreground" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${isCompleted ? "text-muted-foreground" : ""}`}>
                          {lesson.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDuration(lesson.durationMinutes)}
                          {lesson.type === "challenge" && (
                            <Badge variant="secondary" className="ml-2 text-xs">
                              Challenge
                            </Badge>
                          )}
                        </p>
                      </div>
                      {lesson.xpReward && (
                        <span className="text-xs text-xp font-medium">
                          +{lesson.xpReward} XP
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

function AboutCourse({ course }: { course: Course }) {
  const t = useTranslations("course");

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        <div>
          <h3 className="text-xl font-semibold mb-3">{t("about")}</h3>
          <div className="prose prose-neutral dark:prose-invert max-w-none">
            <p>{course.description}</p>
            <p>
              This comprehensive course will take you from beginner to proficient
              in Solana development. You'll learn through a combination of video
              content, reading materials, and hands-on coding challenges.
            </p>
          </div>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-3">{t("prerequisites")}</h3>
          <ul className="space-y-2">
            {(course.prerequisites || [
              "Basic understanding of blockchain concepts",
              "Familiarity with JavaScript or TypeScript",
              "No Rust experience required",
            ]).map((prereq, i) => (
              <li key={i} className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-success" />
                {prereq}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("instructor")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={course.instructor.avatar} />
                <AvatarFallback>
                  {course.instructor.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">{course.instructor.name}</p>
                <p className="text-sm text-muted-foreground">
                  {course.instructor.title || "Senior Developer"}
                </p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              {course.instructor.bio ||
                "Experienced blockchain developer with a passion for teaching. Has been building on Solana since 2021."}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function CourseReviews({ courseId }: { courseId: string }) {
  // In production: fetch reviews from API
  const mockReviews = [
    {
      id: "1",
      user: { name: "Alex Chen", avatar: "" },
      rating: 5,
      comment: "Excellent course! The hands-on challenges really helped solidify my understanding.",
      date: "2 weeks ago",
    },
    {
      id: "2",
      user: { name: "Maria Garcia", avatar: "" },
      rating: 5,
      comment: "Best Solana course I've taken. Clear explanations and great examples.",
      date: "1 month ago",
    },
    {
      id: "3",
      user: { name: "James Wilson", avatar: "" },
      rating: 4,
      comment: "Very comprehensive. Would love more advanced content in future updates.",
      date: "1 month ago",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="text-center">
          <div className="text-4xl font-bold">4.9</div>
          <div className="flex items-center gap-1 mt-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className="h-4 w-4 fill-yellow-500 text-yellow-500"
              />
            ))}
          </div>
          <p className="text-sm text-muted-foreground mt-1">258 reviews</p>
        </div>
      </div>

      <div className="space-y-4">
        {mockReviews.map((review) => (
          <Card key={review.id}>
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <Avatar>
                  <AvatarImage src={review.user.avatar} />
                  <AvatarFallback>
                    {review.user.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{review.user.name}</span>
                    <div className="flex items-center">
                      {[...Array(review.rating)].map((_, i) => (
                        <Star
                          key={i}
                          className="h-3 w-3 fill-yellow-500 text-yellow-500"
                        />
                      ))}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {review.date}
                    </span>
                  </div>
                  <p className="text-sm">{review.comment}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
