"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, BookOpen, Sparkles, Clock, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { PageHeader, EmptyState, ProgressBar } from "@/components/app";
import { MOCK_COURSES, type MockCourse } from "@/lib/services/mock-content";
import { useAllCourses } from "@/hooks";
import { useWallet } from "@solana/wallet-adapter-react";
import { useEnrollment } from "@/hooks";

const difficultyColors = {
    beginner: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
    intermediate: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20",
    advanced: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
};

function CourseCard({ course }: { course: MockCourse }) {
    return (
        <Link
            href={`/courses/${course.slug}`}
            className="group flex flex-col rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/30 hover:shadow-md"
        >
            {/* Tags row */}
            <div className="mb-3 flex flex-wrap gap-1.5">
                <Badge
                    variant="outline"
                    className={difficultyColors[course.difficulty]}
                >
                    {course.difficulty}
                </Badge>
                {course.tags.slice(0, 2).map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                    </Badge>
                ))}
            </div>

            {/* Title + desc */}
            <h3 className="mb-1.5 text-lg font-semibold group-hover:text-primary transition-colors">
                {course.title}
            </h3>
            <p className="mb-4 line-clamp-2 text-sm text-muted-foreground">
                {course.description}
            </p>

            {/* Stats row */}
            <div className="mt-auto flex items-center gap-4 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                    <BookOpen className="h-3.5 w-3.5" />
                    {course.lessonCount} lessons
                </span>
                <span className="inline-flex items-center gap-1">
                    <Sparkles className="h-3.5 w-3.5" />
                    {course.lessonCount * course.xpPerLesson} XP
                </span>
                <span className="inline-flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {course.duration}
                </span>
            </div>
        </Link>
    );
}

export default function CoursesPage() {
    const [search, setSearch] = useState("");
    const [difficulty, setDifficulty] = useState<string>("all");

    const filtered = useMemo(() => {
        return MOCK_COURSES.filter((c) => {
            const matchSearch =
                !search ||
                c.title.toLowerCase().includes(search.toLowerCase()) ||
                c.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));
            const matchDiff = difficulty === "all" || c.difficulty === difficulty;
            return matchSearch && matchDiff;
        });
    }, [search, difficulty]);

    return (
        <div className="space-y-6">
            <PageHeader
                title="Courses"
                subtitle="Browse and enroll in Solana development courses"
            />

            {/* Filters */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Search courses..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <Select value={difficulty} onValueChange={setDifficulty}>
                    <SelectTrigger className="w-full sm:w-44">
                        <Filter className="mr-2 h-4 w-4" />
                        <SelectValue placeholder="Difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All levels</SelectItem>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Course grid */}
            {filtered.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {filtered.map((course) => (
                        <CourseCard key={course.id} course={course} />
                    ))}
                </div>
            ) : (
                <EmptyState
                    icon={BookOpen}
                    title="No courses found"
                    description="Try adjusting your search or filter to find courses."
                />
            )}
        </div>
    );
}
