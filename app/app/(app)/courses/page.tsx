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
            <div className="border-4 rounded-xl hover:bg-zinc-900 cursor-pointer h-full">
                <div className="p-4 h-full flex flex-col">
                    {/* Title + description */}
                    <div>
                        <h2 className="font-game text-2xl line-clamp-2">
                            {course.title}
                        </h2>

                        <p className="font-game text-xl text-gray-400 line-clamp-2 mt-1">
                            {course.description}
                        </p>
                    </div>

                    {/* Push this to bottom */}
                    <div className="flex items-center gap-3 mt-auto pt-4 flex-nowrap overflow-hidden">
                        <h2 className="bg-zinc-800 gap-2 font-game p-1 px-4 rounded-2xl inline-flex items-center whitespace-nowrap">
                            <ChartNoAxesColumnIncreasing className="h-4 w-4" />
                            {course.difficulty}
                        </h2>

                        <span className="font-game text-gray-500 inline-flex items-center gap-1 whitespace-nowrap">
                            <BookOpen className="h-4 w-4" />
                            {course.lessonCount} lessons
                        </span>

                        <span className="font-game text-yellow-400 inline-flex items-center gap-1 whitespace-nowrap">
                            <Sparkles className="h-4 w-4" />
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
        <div className="p-10 md:px-12">
            <h2 className="text-4xl mb-2 font-game">All Courses</h2>

            {/* Search */}
            <div className="relative max-w-md mb-6">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    placeholder="Search courses..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                />
            </div>

            {/* Course grid */}
            {isLoading ? (
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-40 animate-pulse rounded-xl border-4" />
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
