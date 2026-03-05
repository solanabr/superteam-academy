"use client";

import { useState, useMemo, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Search, SlidersHorizontal, BookOpen, Clock, Users, Star, Zap, Loader2, Code2, Shield } from "lucide-react";
import { useWallet } from "@solana/wallet-adapter-react";
import { contentService } from "@/lib/services/sanity-content.service";
import { progressService } from "@/lib/services/local-progress.service";
import { EnrollmentData } from "@/lib/services/interfaces";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { SectionReveal, StaggerContainer, staggerItem } from "@/components/motion/section-reveal";
import { motion } from "framer-motion";
import type { Course, Difficulty } from "@/lib/types";

const difficultyColors: Record<Difficulty, string> = {
    beginner: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    intermediate: "bg-solana-purple/10 text-solana-purple border-solana-purple/20",
    advanced: "bg-orange-500/10 text-orange-500 border-orange-500/20",
    expert: "bg-red-500/10 text-red-500 border-red-500/20",
};

const tracks = ["All", "Core", "DeFi", "NFTs", "Security", "Frontend"];

function CourseCard({ course }: { course: Course }) {
    const t = useTranslations("Courses");

    return (
        <Link
            href={`/courses/${course.slug}`}
            className="group block rounded-2xl border border-border/60 bg-card/80 p-6 backdrop-blur-sm transition-all hover:border-border hover:shadow-xl hover:shadow-solana-purple/5 hover:-translate-y-0.5"
        >
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
                <Badge variant="outline" className={`text-xs ${difficultyColors[course.difficulty]}`}>
                    {course.difficulty}
                </Badge>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    <span>{course.rating}</span>
                </div>
            </div>

            {/* Title */}
            <h3 className="mt-4 font-display text-lg font-bold leading-tight group-hover:gradient-text transition-all">
                {course.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground line-clamp-2">
                {course.shortDescription}
            </p>

            {/* Tags */}
            <div className="mt-3 flex flex-wrap gap-1.5">
                {course.tags.slice(0, 3).map((tag) => (
                    <span key={tag} className="rounded-md bg-accent/80 px-2 py-0.5 text-xs text-muted-foreground">
                        {tag}
                    </span>
                ))}
            </div>

            {/* Progress Bar */}
            {course.progress !== undefined && (
                <div className="mt-4 space-y-1.5">
                    <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{t("progress", { percent: course.progress })}</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-accent">
                        <div
                            className="h-full rounded-full bg-gradient-to-r from-solana-purple to-solana-green transition-all"
                            style={{ width: `${course.progress}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Footer stats */}
            <div className="mt-4 flex items-center justify-between border-t border-border/40 pt-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" />{t("lessons", { count: course.lessonCount })}</span>
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{course.duration}</span>
                </div>
                <span className="flex items-center gap-1 font-semibold text-solana-green">
                    <Zap className="h-3 w-3" />{t("xpReward", { count: course.xpReward })}
                </span>
            </div>
        </Link>
    );
}

export default function CoursesPage() {
    const t = useTranslations("Courses");
    const { publicKey } = useWallet();
    const [search, setSearch] = useState("");
    const [difficulty, setDifficulty] = useState<string>("All");
    const [track, setTrack] = useState<string>("All");
    const [duration, setDuration] = useState<string>("All");
    const [courses, setCourses] = useState<Course[]>([]);
    const [enrollments, setEnrollments] = useState<Record<string, EnrollmentData>>({});
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        contentService.getCourses()
            .then(setCourses)
            .catch(console.error)
            .finally(() => setIsLoading(false));
    }, []);

    useEffect(() => {
        const walletId = publicKey ? publicKey.toString() : "guest";
        progressService.getAllEnrollments(walletId).then(setEnrollments).catch(console.error);
    }, [publicKey]);

    const mappedCourses = useMemo(() => {
        return courses.map(course => {
            const enrollment = enrollments[course.id];
            if (!enrollment) {
                // Return a clean course without mock progress
                const { progress, ...rest } = course;
                return rest;
            }
            const progressValue = (enrollment.completedLessons.length / course.lessonCount) * 100;
            return { ...course, progress: Math.min(progressValue, 100) };
        });
    }, [courses, enrollments]);

    const filtered = useMemo(() => {
        return mappedCourses.filter((c) => {
            const matchSearch =
                !search ||
                c.title.toLowerCase().includes(search.toLowerCase()) ||
                c.tags.some((tag) => tag.toLowerCase().includes(search.toLowerCase()));
            const matchDifficulty = difficulty === "All" || c.difficulty === difficulty.toLowerCase();
            const matchTrack = track === "All" || c.track === track;

            const hours = parseInt(c.duration.replace("h", "")) || 0;
            let matchDuration = true;
            if (duration === "Under 5h") matchDuration = hours < 5;
            if (duration === "5h - 10h") matchDuration = hours >= 5 && hours <= 10;
            if (duration === "10h+") matchDuration = hours > 10;

            return matchSearch && matchDifficulty && matchTrack && matchDuration;
        });
    }, [search, difficulty, track, duration, mappedCourses]);

    return (
        <div className="min-h-screen">
            <Header />
            <main className="pt-28 pb-16">
                <div className="content-container">
                    {/* Page Header */}
                    <SectionReveal>
                        <div className="max-w-2xl">
                            <h1 className="font-display text-4xl font-bold tracking-tight md:text-5xl">
                                {t("title")}
                            </h1>
                            <p className="mt-3 text-lg text-muted-foreground">{t("subtitle")}</p>
                        </div>
                    </SectionReveal>

                    {/* Curated Paths (only show if no search/filter) */}
                    {!search && difficulty === "All" && track === "All" && duration === "All" && (
                        <SectionReveal>
                            <div className="mt-8 mb-12">
                                <h2 className="mb-6 font-display text-2xl font-bold">{t("curatedPaths")}</h2>
                                <div className="grid gap-4 md:grid-cols-3">
                                    {[
                                        { id: "beginner", icon: BookOpen, color: "from-blue-500 to-cyan-400", onClick: () => { setDifficulty("Beginner"); } },
                                        { id: "defi", icon: Code2, color: "from-solana-purple to-violet-400", onClick: () => { setTrack("DeFi"); } },
                                        { id: "nft", icon: Shield, color: "from-orange-500 to-amber-400", onClick: () => { setTrack("NFTs"); } },
                                    ].map((path) => {
                                        const Icon = path.icon;
                                        return (
                                            <button
                                                key={path.id}
                                                onClick={path.onClick}
                                                className="group flex flex-col items-start gap-4 rounded-2xl border border-border/60 bg-card/80 p-6 text-left backdrop-blur-sm transition-all hover:border-border hover:shadow-lg hover:shadow-solana-purple/5 hover:-translate-y-0.5"
                                            >
                                                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${path.color} text-white shadow-lg transition-transform group-hover:scale-110`}>
                                                    <Icon className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <h3 className="font-display text-lg font-bold">
                                                        {t(path.id === "beginner" ? "pathBeginner" : path.id === "defi" ? "pathDefi" : "pathNft")}
                                                    </h3>
                                                    <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                                                        {t(path.id === "beginner" ? "pathBeginnerDesc" : path.id === "defi" ? "pathDefiDesc" : "pathNftDesc")}
                                                    </p>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </SectionReveal>
                    )}

                    {/* Filters Bar */}
                    <SectionReveal delay={0.1}>
                        <div className="mt-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                            {/* Search */}
                            <div className="relative max-w-sm flex-1">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    placeholder={t("search")}
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="h-10 rounded-full pl-9"
                                />
                            </div>

                            {/* Filter pills */}
                            <div className="flex flex-wrap gap-2">
                                {/* Difficulty */}
                                {["All", "Beginner", "Intermediate", "Advanced"].map((d) => (
                                    <Button
                                        key={d}
                                        size="sm"
                                        variant={difficulty === d ? "default" : "outline"}
                                        className={`rounded-full text-xs ${difficulty === d ? "bg-gradient-to-r from-solana-purple to-solana-green text-white border-0" : ""}`}
                                        onClick={() => setDifficulty(d)}
                                    >
                                        {d === "All" ? t("all") : d}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        {/* Track filter */}
                        <div className="mt-4 flex flex-wrap gap-2">
                            {tracks.map((tr) => (
                                <Button
                                    key={tr}
                                    size="sm"
                                    variant={track === tr ? "secondary" : "ghost"}
                                    className="rounded-full text-xs"
                                    onClick={() => setTrack(tr)}
                                >
                                    {tr === "All" ? t("all") : tr}
                                </Button>
                            ))}
                        </div>

                        {/* Duration filter */}
                        <div className="mt-4 flex flex-wrap gap-2 pt-4 border-t border-border/40">
                            {["All", "Under 5h", "5h - 10h", "10h+"].map((dur) => (
                                <Button
                                    key={dur}
                                    size="sm"
                                    variant={duration === dur ? "secondary" : "ghost"}
                                    className="rounded-full text-xs"
                                    onClick={() => setDuration(dur)}
                                >
                                    {dur === "All" ? t("all") : dur === "Under 5h" ? t("under5h") : dur === "5h - 10h" ? t("fiveToTen") : t("over10h")}
                                </Button>
                            ))}
                        </div>
                    </SectionReveal>

                    {/* Course Grid */}
                    {isLoading ? (
                        <div className="mt-16 text-center flex flex-col items-center justify-center text-muted-foreground">
                            <Loader2 className="mx-auto h-10 w-10 animate-spin text-solana-purple" />
                            <p className="mt-4">Loading Courses...</p>
                        </div>
                    ) : filtered.length > 0 ? (
                        <StaggerContainer className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {filtered.map((course) => (
                                <motion.div key={course.id} variants={staggerItem}>
                                    <CourseCard course={course} />
                                </motion.div>
                            ))}
                        </StaggerContainer>
                    ) : (
                        <div className="mt-16 text-center text-muted-foreground">
                            <SlidersHorizontal className="mx-auto h-10 w-10 opacity-30" />
                            <p className="mt-4">{t("noResults")}</p>
                        </div>
                    )}
                </div>
            </main>
            <Footer />
        </div>
    );
}
