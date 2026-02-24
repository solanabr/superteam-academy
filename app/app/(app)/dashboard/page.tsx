"use client";

import Link from "next/link";
import {
    BookOpen,
    Sparkles,
    Flame,
    Trophy,
    ArrowRight,
    Award,
    Clock,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader, ProgressBar } from "@/components/app";
import { getAllCourses } from "@/lib/services/content-service";
import { getMockStreakData } from "@/lib/services/mock-leaderboard";
import { useXpBalance } from "@/hooks";
import { useState, useEffect } from "react";
import type { MockCourse } from "@/lib/services/content-service";

export default function DashboardPage() {
    const { data: xp } = useXpBalance();
    const streak = getMockStreakData();
    const [courses, setCourses] = useState<MockCourse[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        getAllCourses().then((data) => {
            setCourses(data);
            setIsLoading(false);
        });
    }, []);

    const currentCourse = courses[0];

    const xpValue = xp ?? 0;
    const level = Math.floor(xpValue / 500) + 1;
    const xpToNextLevel = 500 - (xpValue % 500);

    return (
        <div className="space-y-6">
            <PageHeader
                title="Dashboard"
                subtitle="Track your progress and continue learning"
            />

            {/* Stats row */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/20">
                            <Sparkles className="h-5 w-5 text-secondary" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{xpValue.toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground">Total XP</p>
                        </div>
                    </div>
                </Card>

                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                            <Trophy className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">Level {level}</p>
                            <p className="text-xs text-muted-foreground">
                                {xpToNextLevel} XP to next
                            </p>
                        </div>
                    </div>
                </Card>

                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10">
                            <Flame className="h-5 w-5 text-orange-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{streak.current} days</p>
                            <p className="text-xs text-muted-foreground">Current streak</p>
                        </div>
                    </div>
                </Card>

                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/20">
                            <Award className="h-5 w-5 text-accent" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">0</p>
                            <p className="text-xs text-muted-foreground">Credentials</p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Level progress */}
            <Card className="p-5">
                <div className="mb-3 flex items-center justify-between">
                    <h3 className="font-semibold">Level Progress</h3>
                    <Badge variant="outline">Level {level}</Badge>
                </div>
                <ProgressBar
                    value={xpValue % 500}
                    max={500}
                    label={`${xpValue % 500} / 500 XP`}
                />
            </Card>

            {/* Continue Learning */}
            {currentCourse && (
                <Card className="p-5">
                    <div className="mb-4 flex items-center justify-between">
                        <h3 className="font-semibold">Continue Learning</h3>
                        <Button asChild variant="ghost" size="sm">
                            <Link href="/courses">
                                View All <ArrowRight className="ml-1 h-4 w-4" />
                            </Link>
                        </Button>
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="space-y-1">
                            <p className="font-medium">{currentCourse.title}</p>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                <span className="inline-flex items-center gap-1">
                                    <BookOpen className="h-3.5 w-3.5" />
                                    {currentCourse.lessonCount} lessons
                                </span>
                                <span className="inline-flex items-center gap-1">
                                    <Clock className="h-3.5 w-3.5" />
                                    {currentCourse.duration}
                                </span>
                            </div>
                        </div>
                        <Button asChild size="sm">
                            <Link href={`/courses/${currentCourse.slug}`}>
                                Resume <ArrowRight className="ml-1 h-4 w-4" />
                            </Link>
                        </Button>
                    </div>
                </Card>
            )}

            {/* Streak calendar */}
            <Card className="p-5">
                <h3 className="mb-3 font-semibold">Learning Streak</h3>
                <div className="flex gap-1.5">
                    {streak.history.map((day, i) => (
                        <div
                            key={i}
                            className={`h-8 w-8 rounded-md transition-colors ${day
                                    ? "bg-primary"
                                    : "bg-muted"
                                }`}
                            title={day ? "Active" : "Missed"}
                        />
                    ))}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">Last 14 days</p>
            </Card>

            {/* Recommended courses */}
            {courses.length > 1 && (
                <div className="space-y-3">
                    <h3 className="font-semibold">Recommended Courses</h3>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {courses.slice(1, 4).map((c) => (
                        <Link
                            key={c.id}
                            href={`/courses/${c.slug}`}
                            className="group rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/30 hover:shadow-md"
                        >
                            <h4 className="mb-1 font-medium group-hover:text-primary transition-colors">
                                {c.title}
                            </h4>
                            <p className="mb-3 line-clamp-2 text-xs text-muted-foreground">
                                {c.description}
                            </p>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                <span className="inline-flex items-center gap-1">
                                    <BookOpen className="h-3 w-3" />
                                    {c.lessonCount}
                                </span>
                                <span className="inline-flex items-center gap-1">
                                    <Sparkles className="h-3 w-3" />
                                    {c.lessonCount * c.xpPerLesson} XP
                                </span>
                            </div>
                        </Link>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
