"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { Search, BookOpen, Sparkles, Clock, ChartNoAxesColumnIncreasing } from "lucide-react";
import { Input } from "@/components/ui/input";
import { PageHeader, EmptyState } from "@/components/app";
import { getAllCourses, type MockCourse } from "@/lib/services/content-service";

function CourseCard({ course }: { course: MockCourse }) {
    return (
        <Link href={`/courses/${course.slug}`} className="block h-full">
            <div className="border-4 rounded-2xl border-border hover:bg-accent cursor-pointer h-full transition-colors">
                <div className="p-4 h-full flex flex-col font-game">
                    {/* Title + description */}
                    <div className="min-w-0">
                        <h2 className="font-game text-2xl sm:text-3xl line-clamp-2">
                            {course.title}
                        </h2>

                        <p className="font-game text-lg sm:text-xl text-muted-foreground line-clamp-2 mt-1">
                            {course.description}
                        </p>
                    </div>

                    {/* Push this to bottom */}
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-auto pt-4">
                        <h2 className="bg-muted gap-2 font-game text-base sm:text-lg p-1.5 px-4 rounded-2xl inline-flex items-center whitespace-nowrap">
                            <ChartNoAxesColumnIncreasing className="h-5 w-5" />
                            {course.difficulty}
                        </h2>

                        <span className="font-game text-base sm:text-lg text-muted-foreground inline-flex items-center gap-1 whitespace-nowrap">
                            <BookOpen className="h-5 w-5" />
                            {course.lessonCount} lessons
                        </span>

                        <span className="font-game text-base sm:text-lg text-yellow-400 inline-flex items-center gap-1 whitespace-nowrap">
                            <Sparkles className="h-5 w-5" />
                            {course.lessonCount * course.xpPerLesson} XP
                        </span>
                    </div>
                </div>
            </div>
        </Link>
    );
}

export default function CoursesPage() {
    const [search, setSearch] = useState("");
    const [courses, setCourses] = useState<MockCourse[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        getAllCourses().then((data) => {
            setCourses(data);
            setIsLoading(false);
        });
    }, []);

    const filtered = useMemo(() => {
        return courses.filter((c) => {
            const matchSearch =
                !search ||
                c.title.toLowerCase().includes(search.toLowerCase()) ||
                c.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));
            return matchSearch;
        });
    }, [courses, search]);

    return (
        <div className="p-4 sm:p-6 md:p-8 md:px-10 lg:px-12">
            <h2 className="font-game text-4xl sm:text-5xl mb-2">All Courses</h2>

            {/* Search */}
            <div className="relative max-w-md mb-6">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                    placeholder="Search courses..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 text-base sm:text-lg"
                />
            </div>

            {/* Course grid */}
            {isLoading ? (
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-40 animate-pulse rounded-2xl border-4 border-border" />
                    ))}
                </div>
            ) : filtered.length > 0 ? (
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {filtered.map((course) => (
                        <CourseCard key={course.id} course={course} />
                    ))}
                </div>
            ) : (
                <EmptyState
                    icon={BookOpen}
                    title="No courses found"
                    description="Try adjusting your search to find courses."
                />
            )}
        </div>
    );
}
