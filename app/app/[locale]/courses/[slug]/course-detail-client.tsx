"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { SectionReveal } from "@/components/motion/section-reveal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
    ArrowRight,
    BookOpen,
    Clock,
    Zap,
    Users,
    Star,
    CheckCircle2,
    Circle,
    Lock,
    ChevronDown,
    ChevronRight,
    PlayCircle,
    FileText,
    Code2,
    HelpCircle,
    Loader2
} from "lucide-react";
import type { Course, Lesson } from "@/lib/types";
import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { progressService } from "@/lib/services/local-progress.service";
import { EnrollmentData } from "@/lib/services/interfaces";
import { useEnrollment } from "@/lib/enrollment-context";
import { TutorialRunner } from "@/components/tutorial-runner";

const lessonTypeIcons: Record<string, React.ElementType> = {
    reading: FileText,
    code: Code2,
    quiz: HelpCircle,
    video: PlayCircle,
};

const difficultyColors: Record<string, string> = {
    beginner: "text-emerald-500",
    intermediate: "text-solana-purple",
    advanced: "text-orange-500",
    expert: "text-red-500",
};

function LessonRow({ lesson, courseSlug }: { lesson: Lesson; courseSlug: string }) {
    const t = useTranslations("CourseDetail");
    const Icon = lessonTypeIcons[lesson.type] || FileText;

    return (
        <Link
            href={`/courses/${courseSlug}/lessons/${lesson.id}`}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-accent`}
        >
            {lesson.isCompleted ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-solana-green" />
            ) : (
                <Circle className="h-4 w-4 shrink-0 text-muted-foreground" />
            )}
            <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="flex-1 truncate">{lesson.title}</span>
            <span className="text-xs text-muted-foreground">{lesson.duration}</span>
            <span className="text-xs font-medium text-solana-green">+{lesson.xp}</span>
        </Link>
    );
}

export function CourseDetailClient({ course }: { course: Course }) {
    const t = useTranslations("CourseDetail");
    const { publicKey } = useWallet();
    const { enrollInCourse } = useEnrollment(); // Global Context for UI sync

    const [expandedModules, setExpandedModules] = useState<Set<string>>(
        new Set(course.modules.map((m) => m.id))
    );
    const [enrollment, setEnrollment] = useState<EnrollmentData | null>(null);
    const [isEnrolling, setIsEnrolling] = useState(false);

    useEffect(() => {
        const walletId = publicKey ? publicKey.toString() : "guest";
        progressService.getEnrollment(course.id, walletId).then(setEnrollment).catch(console.error);
    }, [course.id, publicKey]);

    const toggleModule = (id: string) => {
        setExpandedModules((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handleEnroll = async () => {
        if (!publicKey) {
            alert("Please connect your wallet first.");
            return;
        }
        setIsEnrolling(true);
        try {
            await progressService.enroll(course.id, publicKey.toString());
            enrollInCourse(course.id);
            const fresh = await progressService.getEnrollment(course.id, publicKey.toString());
            setEnrollment(fresh);
        } catch (e) {
            console.error("Failed to enroll", e);
        } finally {
            setIsEnrolling(false);
        }
    };

    // Calculate dynamic completion stats
    const totalLessons = course.modules.flatMap((m) => m.lessons).length;
    let completedLessonCount = 0;

    // Map dynamic progress onto course structure
    const dynamicModules = course.modules.map((mod, modIdx) => {
        const modLessonsStartIdx = course.modules.slice(0, modIdx).reduce((acc, m) => acc + m.lessons.length, 0);

        const dynamicLessons = mod.lessons.map((lesson, lessonIdx) => {
            const globalIndex = modLessonsStartIdx + lessonIdx;
            const isCompleted = enrollment?.completedLessons.includes(globalIndex) || false;
            if (isCompleted) completedLessonCount++;
            return { ...lesson, isCompleted };
        });

        const modCompleted = dynamicLessons.filter((l) => l.isCompleted).length;
        const isModCompleted = modCompleted === dynamicLessons.length && dynamicLessons.length > 0;

        return { ...mod, lessons: dynamicLessons, modCompleted, isModCompleted };
    });

    const isEnrolled = !!enrollment;
    const courseProgress = isEnrolled ? Math.floor((completedLessonCount / totalLessons) * 100) : undefined;

    return (
        <div className="min-h-screen">
            <Header />
            <TutorialRunner pageKey="courseDetail" />
            <main className="pt-28 pb-16">
                <div className="content-container">
                    <div className="grid gap-10 lg:grid-cols-3">
                        {/* Main Content */}
                        <div className="lg:col-span-2 space-y-8">
                            {/* Breadcrumb-like header */}
                            <SectionReveal>
                                <div data-tutorial="course-header">
                                    <Link href="/courses" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                                        ← {t("about").split(" ")[0]}
                                    </Link>
                                    <div className="mt-4 flex flex-wrap items-center gap-4">
                                        <Badge variant="outline" className={`${difficultyColors[course.difficulty]}`}>
                                            {course.difficulty}
                                        </Badge>
                                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                            <Clock className="h-4 w-4" />
                                            <span>{course.duration}</span>
                                        </div>
                                        <span className="text-sm text-muted-foreground">{course.track}</span>
                                    </div>
                                    <h1 className="mt-3 font-display text-3xl font-bold tracking-tight md:text-4xl">
                                        {course.title}
                                    </h1>
                                    <p className="mt-3 text-muted-foreground leading-relaxed">{course.description}</p>

                                    {/* Instructor */}
                                    <div className="mt-6 flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-solana-purple/20 to-solana-green/20">
                                            <span className="text-sm font-bold">{course.instructor.name[0]}</span>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium">{course.instructor.name}</p>
                                            <p className="text-xs text-muted-foreground">{course.instructor.title}</p>
                                        </div>
                                    </div>
                                </div>
                            </SectionReveal>

                            {/* What you'll learn */}
                            <SectionReveal delay={0.1}>
                                <div className="rounded-2xl border border-border/60 bg-card/80 p-6">
                                    <h2 className="font-display text-xl font-bold">{t("outcomes")}</h2>
                                    <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                                        {course.outcomes.map((outcome, i) => (
                                            <li key={i} className="flex items-start gap-2 text-sm">
                                                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-solana-green" />
                                                <span>{outcome}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </SectionReveal>

                            {/* Prerequisites */}
                            {course.prerequisites.length > 0 && (
                                <SectionReveal delay={0.15}>
                                    <div>
                                        <h2 className="font-display text-xl font-bold">{t("prerequisites")}</h2>
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            {course.prerequisites.map((p) => (
                                                <Badge key={p} variant="secondary" className="rounded-full">{p}</Badge>
                                            ))}
                                        </div>
                                    </div>
                                </SectionReveal>
                            )}

                            {/* Modules */}
                            <SectionReveal delay={0.2}>
                                <div data-tutorial="course-modules">
                                    <h2 className="font-display text-xl font-bold">{t("modules")}</h2>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        {t("lessonCount", { count: totalLessons })} · {course.duration}
                                    </p>
                                    <div className="mt-4 space-y-3">
                                        {dynamicModules.map((mod, i) => {
                                            const isExpanded = expandedModules.has(mod.id);

                                            return (
                                                <div key={mod.id} className="rounded-xl border border-border/60 bg-card/50 overflow-hidden">
                                                    <button
                                                        onClick={() => toggleModule(mod.id)}
                                                        className="flex w-full items-center gap-3 p-4 text-left hover:bg-accent/50 transition-colors"
                                                    >
                                                        {isExpanded ? (
                                                            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                                                        ) : (
                                                            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                                                        )}
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-xs font-medium text-muted-foreground">
                                                                    {String(i + 1).padStart(2, "0")}
                                                                </span>
                                                                <span className="font-semibold text-sm">{mod.title}</span>
                                                                {mod.isModCompleted && <CheckCircle2 className="h-3.5 w-3.5 text-solana-green" />}
                                                            </div>
                                                            <p className="mt-0.5 text-xs text-muted-foreground">{mod.description}</p>
                                                        </div>
                                                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                                                            {mod.modCompleted}/{mod.lessons.length}
                                                        </span>
                                                    </button>
                                                    {isExpanded && (
                                                        <div className="border-t border-border/40 px-4 py-2 space-y-0.5">
                                                            {mod.lessons.map((lesson) => (
                                                                <LessonRow key={lesson.id} lesson={lesson} courseSlug={course.slug} />
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </SectionReveal>

                            {/* Reviews */}
                            {course.reviews.length > 0 && (
                                <SectionReveal delay={0.25}>
                                    <div>
                                        <h2 className="font-display text-xl font-bold">{t("reviews")}</h2>
                                        <div className="mt-4 space-y-4">
                                            {course.reviews.map((review, i) => (
                                                <div key={i} className="rounded-xl border border-border/40 bg-card/50 p-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-xs font-bold">
                                                            {review.author[0].toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium">{review.author}</p>
                                                            <div className="flex gap-0.5">
                                                                {Array.from({ length: 5 }).map((_, s) => (
                                                                    <Star key={s} className={`h-3 w-3 ${s < review.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`} />
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <p className="mt-2 text-sm text-muted-foreground">{review.comment}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </SectionReveal>
                            )}
                        </div>

                        {/* Sidebar */}
                        <div className="lg:col-span-1">
                            <SectionReveal direction="right">
                                <div className="sticky top-24 rounded-2xl border border-border/60 bg-card/80 p-6 backdrop-blur-sm">
                                    {/* Progress */}
                                    {courseProgress !== undefined && (
                                        <div className="mb-6">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">{completedLessonCount}/{totalLessons} lessons</span>
                                                <span className="font-semibold">{courseProgress}%</span>
                                            </div>
                                            <Progress value={courseProgress} className="mt-2 h-2" />
                                        </div>
                                    )}

                                    {/* Stats */}
                                    <div className="space-y-3 text-sm">
                                        <div className="flex justify-between">
                                            <span className="flex items-center gap-2 text-muted-foreground"><Clock className="h-4 w-4" />{t("duration")}</span>
                                            <span className="font-medium">{course.duration}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="flex items-center gap-2 text-muted-foreground"><BookOpen className="h-4 w-4" />{t("lessonCount", { count: "" })}</span>
                                            <span className="font-medium">{totalLessons}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="flex items-center gap-2 text-muted-foreground"><Zap className="h-4 w-4" />{t("xp")}</span>
                                            <span className="font-medium text-solana-green">+{course.xpReward}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="flex items-center gap-2 text-muted-foreground"><Users className="h-4 w-4" />{t("enrolled")}</span>
                                            <span className="font-medium">{course.enrolled.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="flex items-center gap-2 text-muted-foreground"><Star className="h-4 w-4" />Rating</span>
                                            <span className="font-medium">{course.rating}/5</span>
                                        </div>
                                    </div>

                                    {/* CTA */}
                                    <Button
                                        size="lg"
                                        onClick={!isEnrolled ? handleEnroll : undefined}
                                        disabled={isEnrolling}
                                        className="mt-6 w-full rounded-full bg-gradient-to-r from-solana-purple to-solana-green text-white font-semibold hover:brightness-110"
                                    >
                                        {isEnrolling ? (
                                            <Loader2 className="h-5 w-5 animate-spin" />
                                        ) : isEnrolled ? (
                                            <>
                                                {t("continuelearning")}
                                                <ArrowRight className="ml-2 h-4 w-4" />
                                            </>
                                        ) : (
                                            <>
                                                {t("enrollNow")}
                                                <ArrowRight className="ml-2 h-4 w-4" />
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </SectionReveal>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
