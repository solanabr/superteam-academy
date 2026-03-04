"use client";

import { EmptyState } from "@/components/app";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEnrollment } from "@/hooks";
import { getCompletedAtFromEnrollment } from "@/lib/lesson-bitmap";
import { urlFor } from "@/lib/sanity/client";
import { getAllCourses, getCourseIdForProgram, type MockCourse } from "@/lib/services/content-service";
import { cn } from "@/lib/utils";
import {
    ArrowRight,
    BookOpen,
    CheckCircle2,
    Clock3,
    Gauge,
    Layers3,
    Search,
    Sparkles,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const difficultyFilters = [
    { value: "all", label: "All" },
    { value: "beginner", label: "Beginner" },
    { value: "intermediate", label: "Intermediate" },
    { value: "advanced", label: "Advanced" },
] as const;

const difficultyTone: Record<MockCourse["difficulty"], string> = {
    beginner: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
    intermediate: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-300 border-yellow-500/20",
    advanced: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
};

const fallbackImages: Record<string, string> = {
    "intro-to-solana": "/courses/sol-fundamentals.png",
    "solana-fundamentals": "/courses/sol-fundamentals.png",
    "anchor-development": "/courses/anchor-dev.png",
    "token-extensions": "/courses/token-extensions.png",
    "metaplex-core": "/courses/metaplex-nfts.png",
};

function getCourseImageUrl(course: MockCourse): string {
    if (course.image) {
        try {
            return urlFor(course.image).width(1800).height(1000).quality(88).url();
        } catch {
            // fall back to static preview when image data is incomplete
        }
    }
    return fallbackImages[course.slug] ?? "/courses/sol-fundamentals.png";
}

function CourseCard({ course }: { course: MockCourse }) {
    const courseId = getCourseIdForProgram(course);
    const { data: enrollment } = useEnrollment(courseId);
    const completedAt = getCompletedAtFromEnrollment(enrollment ?? undefined);
    const isCompleted = completedAt != null;
    const isEnrolled = !!enrollment;
    const totalXp = course.lessonCount * course.xpPerLesson;

    return (
        <Link href={`/courses/${course.slug}`} className="block h-full">
            <article className="relative isolate flex h-full flex-col overflow-hidden rounded-3xl border border-border/70 bg-gradient-to-b from-card/95 to-card/80 shadow-md hover:border-primary/25">
                <div className="relative h-48 overflow-hidden border-b border-border/60 bg-gradient-to-br from-muted/40 via-muted/15 to-background">
                    <Image
                        src={getCourseImageUrl(course)}
                        alt={course.title}
                        width={900}
                        height={500}
                        className="h-full w-full object-contain px-3 py-2"
                        priority={false}
                    />
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/30 to-transparent" />
                </div>

                <div className="flex flex-1 flex-col p-4 sm:p-5">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                        <Badge
                            variant="outline"
                            className={cn("text-xs capitalize shadow-sm", difficultyTone[course.difficulty])}
                        >
                            <Gauge className="mr-1 h-3.5 w-3.5" />
                            {course.difficulty}
                        </Badge>

                        {isCompleted && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-green-500/30 bg-green-500/10 px-2 py-1 text-xs text-green-300">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Completed
                            </span>
                        )}
                        {!isCompleted && isEnrolled && (
                            <span className="rounded-full border border-yellow-500/30 bg-yellow-500/10 px-2 py-1 text-xs text-yellow-300">
                                Enrolled
                            </span>
                        )}
                    </div>

                    <h3 className="line-clamp-2 font-game text-[1.85rem] leading-tight sm:text-[2rem]">{course.title}</h3>
                    <p className="mt-2 line-clamp-3 text-sm text-muted-foreground sm:text-[0.95rem]">{course.description}</p>

                    {course.tags.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                            {course.tags.slice(0, 3).map((tag) => (
                                <span
                                    key={tag}
                                    className="rounded-full border border-border/70 bg-background/55 px-2 py-0.5 text-[11px] text-muted-foreground"
                                >
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )}

                    <div className="mt-4 grid grid-cols-3 gap-2 text-xs sm:text-sm">
                        <div className="rounded-xl border border-border/70 bg-background/50 p-2.5">
                            <p className="text-muted-foreground">Lessons</p>
                            <p className="mt-1 inline-flex items-center gap-1 font-medium">
                                <BookOpen className="h-3.5 w-3.5" />
                                {course.lessonCount}
                            </p>
                        </div>
                        <div className="rounded-xl border border-border/70 bg-background/50 p-2.5">
                            <p className="text-muted-foreground">Duration</p>
                            <p className="mt-1 inline-flex items-center gap-1 font-medium">
                                <Clock3 className="h-3.5 w-3.5" />
                                {course.duration}
                            </p>
                        </div>
                        <div className="rounded-xl border border-border/70 bg-background/50 p-2.5">
                            <p className="text-muted-foreground">XP</p>
                            <p className="mt-1 inline-flex items-center gap-1 font-medium text-yellow-300">
                                <Sparkles className="h-3.5 w-3.5" />
                                {totalXp}
                            </p>
                        </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between rounded-xl border border-border/70 bg-background/55 px-3 py-2.5 text-sm">
                        <span className="text-muted-foreground">
                            {isCompleted ? "Review course" : isEnrolled ? "Continue learning" : "Start learning"}
                        </span>
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-border/70 bg-muted/30 text-muted-foreground">
                            <ArrowRight className="h-4 w-4" />
                        </span>
                    </div>
                </div>
            </article>
        </Link>
    );
}

export default function CoursesPage() {
    const [search, setSearch] = useState("");
    const [courses, setCourses] = useState<MockCourse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [difficulty, setDifficulty] = useState<(typeof difficultyFilters)[number]["value"]>("all");

    useEffect(() => {
        getAllCourses().then((data) => {
            setCourses(data);
            setIsLoading(false);
        });
    }, []);

    const filtered = useMemo(() => {
        return courses.filter((c) => {
            const searchText = search.trim().toLowerCase();
            const matchSearch =
                !searchText ||
                c.title.toLowerCase().includes(searchText) ||
                c.description.toLowerCase().includes(searchText) ||
                c.tags.some((t) => t.toLowerCase().includes(searchText));
            const matchDifficulty = difficulty === "all" || c.difficulty === difficulty;
            return matchSearch && matchDifficulty;
        });
    }, [courses, search, difficulty]);

    const catalogStats = useMemo(() => {
        const lessons = filtered.reduce((sum, course) => sum + course.lessonCount, 0);
        const xp = filtered.reduce((sum, course) => sum + course.lessonCount * course.xpPerLesson, 0);
        return { courses: filtered.length, lessons, xp };
    }, [filtered]);

    return (
        <div className="space-y-6 sm:space-y-7">
            <section className="rounded-2xl border border-border/80 bg-card/80 p-4 sm:p-5">
                <div className="space-y-4">
                    <div>
                        <h2 className="font-game text-4xl sm:text-5xl">Courses</h2>
                        <p className="mt-1 text-sm text-muted-foreground sm:text-base">
                            Choose your Solana learning path and continue from where you left off.
                        </p>
                    </div>

                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div className="relative w-full md:max-w-xl">
                            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Search by title, tag, or topic..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="h-11 pl-10 text-base"
                            />
                        </div>

                        <div className="grid grid-cols-3 gap-2 rounded-xl border border-border/70 bg-muted/15 p-2 text-sm">
                            <div className="rounded-lg bg-background/70 px-2 py-1.5 text-center">
                                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Courses</p>
                                <p className="font-semibold">{catalogStats.courses}</p>
                            </div>
                            <div className="rounded-lg bg-background/70 px-2 py-1.5 text-center">
                                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Lessons</p>
                                <p className="font-semibold">{catalogStats.lessons}</p>
                            </div>
                            <div className="rounded-lg bg-background/70 px-2 py-1.5 text-center">
                                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Total XP</p>
                                <p className="font-semibold text-yellow-300">{catalogStats.xp}</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {difficultyFilters.map((filter) => {
                            const isActive = difficulty === filter.value;
                            return (
                                <Button
                                    key={filter.value}
                                    variant={isActive ? "secondary" : "ghost"}
                                    size="sm"
                                    onClick={() => setDifficulty(filter.value)}
                                    className={cn(
                                        "rounded-full border px-3",
                                        isActive
                                            ? "border-border bg-muted text-foreground"
                                            : "border-border/60 bg-background/30 text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    {filter.label}
                                </Button>
                            );
                        })}
                    </div>
                </div>
            </section>

            {isLoading ? (
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-[380px] animate-pulse rounded-2xl border border-border/80 bg-muted/30" />
                    ))}
                </div>
            ) : filtered.length > 0 ? (
                <section className="space-y-3">
                    <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-muted/20 px-3 py-1 text-xs uppercase tracking-wider text-muted-foreground">
                        <Layers3 className="h-3.5 w-3.5" />
                        Showing {filtered.length} course{filtered.length === 1 ? "" : "s"}
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                        {filtered.map((course) => (
                            <CourseCard key={course.id} course={course} />
                        ))}
                    </div>
                </section>
            ) : (
                <EmptyState
                    icon={BookOpen}
                    title="No courses found"
                    description="Try a different keyword or reset the difficulty filter."
                />
            )}
        </div>
    );
}
