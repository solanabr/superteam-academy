"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import {
  ArrowLeft,
  BookOpen,
  Clock,
  Star,
  Users,
  Zap,
  ChevronDown,
  ChevronRight,
  Lock,
  CheckCircle2,
  Play,
  Code,
  Award,
  Twitter,
  Github,
  Shield,
} from "lucide-react";
import { PageLayout } from "@/components/layout/page-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { MOCK_COURSES, MOCK_MODULES } from "@/lib/mock-data";
import { formatXP } from "@/lib/utils/xp";
import { cn } from "@/lib/utils/cn";
import { toast } from "sonner";
import { learningProgressService } from "@/lib/services/learning-progress";

const difficultyColors: Record<string, string> = {
  beginner: "#10b981",
  intermediate: "#3b82f6",
  advanced: "#f97316",
  expert: "#ef4444",
};

export default function CourseDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { connected, publicKey } = useWallet();
  const { setVisible } = useWalletModal();
  const [expandedModules, setExpandedModules] = useState<Set<string>>(
    new Set(["m1"])
  );
  const [enrolling, setEnrolling] = useState(false);
  const [enrolled, setEnrolled] = useState(false);

  const course = MOCK_COURSES.find((c) => c.slug === slug);
  const modules = MOCK_MODULES[slug] ?? [];

  if (!course) {
    return (
      <PageLayout>
        <div className="min-h-screen pt-24 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Course not found</h1>
            <Button asChild>
              <Link href="/courses">Back to Courses</Link>
            </Button>
          </div>
        </div>
      </PageLayout>
    );
  }

  const toggleModule = (id: string) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleEnroll = async () => {
    if (!connected) {
      setVisible(true);
      return;
    }
    setEnrolling(true);
    try {
      await learningProgressService.enroll(
        publicKey?.toBase58() ?? "demo",
        course.id
      );
      setEnrolled(true);
      toast.success("Enrolled successfully! 🎉", {
        description: "Start your first lesson to earn XP.",
      });
    } catch {
      toast.error("Failed to enroll. Please try again.");
    } finally {
      setEnrolling(false);
    }
  };

  const totalLessons = modules.reduce(
    (sum, m) => sum + m.lessons.length,
    0
  );
  const challengeCount = modules.reduce(
    (sum, m) => sum + m.lessons.filter((l) => l.type === "challenge").length,
    0
  );

  return (
    <PageLayout>
      <div className="min-h-screen pt-16">
        {/* Hero */}
        <div className="relative py-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
          <div className="absolute inset-0 bg-grid opacity-20" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#9945FF]/10 via-transparent to-transparent" />
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `url(${course.thumbnail})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/70 to-background" />

          <div className="max-w-7xl mx-auto relative z-10">
            <Link
              href="/courses"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Courses
            </Link>

            <div className="grid lg:grid-cols-3 gap-8">
              {/* Course Info */}
              <div className="lg:col-span-2">
                <div className="flex items-center gap-2 mb-4">
                  <span
                    className="text-xs font-medium px-2 py-1 rounded-md"
                    style={{
                      backgroundColor: `${course.track.color}20`,
                      color: course.track.color,
                    }}
                  >
                    {course.track.icon} {course.track.name}
                  </span>
                  <Badge
                    variant={course.difficulty as "beginner" | "intermediate" | "advanced" | "expert"}
                  >
                    {course.difficulty}
                  </Badge>
                </div>

                <h1 className="text-3xl sm:text-4xl font-bold mb-4">
                  {course.title}
                </h1>
                <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                  {course.description}
                </p>

                {/* Stats */}
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6">
                  <span className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    <strong className="text-foreground">{course.rating}</strong>
                    <span>({course.reviewCount} reviews)</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {course.enrolledCount.toLocaleString()} enrolled
                  </span>
                  <span className="flex items-center gap-1">
                    <BookOpen className="h-4 w-4" />
                    {course.lessonCount} lessons
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {Math.floor(course.duration / 60)}h {course.duration % 60}m
                  </span>
                  <span className="flex items-center gap-1">
                    <Zap className="h-4 w-4 text-[#14F195]" />
                    <strong className="text-[#14F195]">{formatXP(course.xpReward)} XP</strong>
                  </span>
                </div>

                {/* Instructor */}
                <div className="flex items-center gap-3 p-4 glass-card rounded-xl">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#9945FF] to-[#14F195] flex items-center justify-center text-lg font-bold text-white">
                    {course.instructor.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">{course.instructor.name}</p>
                    <p className="text-sm text-muted-foreground">{course.instructor.bio}</p>
                  </div>
                  <div className="flex gap-2">
                    {course.instructor.twitter && (
                      <Link href={`https://twitter.com/${course.instructor.twitter}`} target="_blank">
                        <Twitter className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
                      </Link>
                    )}
                    {course.instructor.github && (
                      <Link href={`https://github.com/${course.instructor.github}`} target="_blank">
                        <Github className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
                      </Link>
                    )}
                  </div>
                </div>
              </div>

              {/* Enrollment Card */}
              <div className="lg:col-span-1">
                <div className="glass-card p-6 sticky top-24">
                  <div className="aspect-video rounded-lg overflow-hidden mb-4 relative bg-gradient-to-br from-[#9945FF]/20 to-[#14F195]/10">
                    <div
                      className="absolute inset-0 bg-cover bg-center"
                      style={{ backgroundImage: `url(${course.thumbnail})` }}
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center cursor-pointer hover:bg-white/30 transition-colors">
                        <Play className="h-6 w-6 text-white ml-1" />
                      </div>
                    </div>
                  </div>

                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-3xl font-bold">Free</span>
                      <div className="flex items-center gap-1">
                        <Zap className="h-5 w-5 text-[#14F195]" />
                        <span className="text-lg font-bold text-[#14F195]">
                          {formatXP(course.xpReward)} XP
                        </span>
                      </div>
                    </div>
                  </div>

                  <Button
                    variant={enrolled ? "glass" : "gradient"}
                    size="lg"
                    className="w-full mb-4"
                    onClick={enrolled ? undefined : handleEnroll}
                    disabled={enrolling}
                    asChild={enrolled}
                  >
                    {enrolled ? (
                      <Link href={`/courses/${slug}/lessons/l1`}>
                        <Play className="h-4 w-4" />
                        Start Course
                      </Link>
                    ) : (
                      <>
                        {enrolling ? (
                          <span className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Enrolling...
                          </span>
                        ) : (
                          <span className="flex items-center gap-2">
                            {connected ? (
                              <>
                                <Zap className="h-4 w-4" />
                                Enroll Now
                              </>
                            ) : (
                              <>
                                Connect Wallet to Enroll
                              </>
                            )}
                          </span>
                        )}
                      </>
                    )}
                  </Button>

                  {/* Credential info */}
                  <div className="p-3 rounded-lg bg-[#9945FF]/10 border border-[#9945FF]/20 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Award className="h-4 w-4 text-[#9945FF]" />
                      <span className="text-muted-foreground">
                        Earn a soulbound NFT credential on completion
                      </span>
                    </div>
                  </div>

                  {/* Course highlights */}
                  <div className="space-y-2 text-sm">
                    {[
                      { icon: BookOpen, text: `${course.lessonCount} lessons` },
                      { icon: Code, text: `${challengeCount} coding challenges` },
                      { icon: Award, text: "NFT credential on Solana" },
                      { icon: Shield, text: "Soulbound XP tokens" },
                      { icon: Users, text: "Discord community access" },
                    ].map(({ icon: Icon, text }) => (
                      <div key={text} className="flex items-center gap-2 text-muted-foreground">
                        <Icon className="h-4 w-4 text-[#14F195]" />
                        {text}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Curriculum */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <div className="lg:max-w-2xl">
            <h2 className="text-2xl font-bold mb-2">Course Curriculum</h2>
            <p className="text-muted-foreground mb-6">
              {totalLessons} lessons • {challengeCount} challenges •{" "}
              {Math.floor(course.duration / 60)}h {course.duration % 60}m
            </p>

            <div className="space-y-3">
              {modules.length > 0 ? (
                modules.map((module) => (
                  <div key={module.id} className="glass-card overflow-hidden">
                    <button
                      onClick={() => toggleModule(module.id)}
                      className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors text-left"
                    >
                      <div className="flex-1">
                        <h3 className="font-semibold text-sm">{module.title}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {module.lessons.length} lessons
                        </p>
                      </div>
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 text-muted-foreground transition-transform",
                          expandedModules.has(module.id) && "rotate-180"
                        )}
                      />
                    </button>

                    {expandedModules.has(module.id) && (
                      <div className="border-t border-border">
                        {module.lessons.map((lesson) => (
                          <div
                            key={lesson.id}
                            className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors border-b border-border/50 last:border-0"
                          >
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                              style={{
                                backgroundColor: lesson.type === "challenge" ? "#9945FF20" : "#14F19520",
                              }}
                            >
                              {lesson.type === "challenge" ? (
                                <Code className="h-3.5 w-3.5 text-[#9945FF]" />
                              ) : (
                                <Play className="h-3.5 w-3.5 text-[#14F195]" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{lesson.title}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <Badge
                                  variant={lesson.type === "challenge" ? "purple" : "green"}
                                  className="text-xs"
                                >
                                  {lesson.type}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {lesson.duration}m
                                </span>
                                <span className="text-xs text-[#14F195]">
                                  +{lesson.xpReward} XP
                                </span>
                              </div>
                            </div>
                            {enrolled ? (
                              <Link
                                href={`/courses/${slug}/lessons/${lesson.id}`}
                                className="text-xs text-primary hover:underline"
                              >
                                <ChevronRight className="h-4 w-4" />
                              </Link>
                            ) : (
                              <Lock className="h-4 w-4 text-muted-foreground/50" />
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                /* Placeholder modules when no mock data */
                Array.from({ length: course.lessonCount > 0 ? Math.min(4, Math.ceil(course.lessonCount / 3)) : 3 }).map((_, idx) => (
                  <div key={idx} className="glass-card overflow-hidden">
                    <div className="flex items-center justify-between p-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-sm">Module {idx + 1}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {Math.ceil(course.lessonCount / 4)} lessons
                        </p>
                      </div>
                      <Lock className="h-4 w-4 text-muted-foreground/50" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
