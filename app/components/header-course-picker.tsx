"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { useEnrollment } from "@/lib/enrollment-context";
import { CoursePicker } from "@/components/course-picker";
import { contentService } from "@/lib/services/sanity-content.service";
import { Course } from "@/lib/types";
import { BookOpen, ChevronDown, Plus } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export function HeaderCoursePicker() {
    const { isAuthenticated } = useAuth();
    const { enrolledCourseIds, activeCourseId, setActiveCourse } = useEnrollment();
    const [courses, setCourses] = useState<Course[]>([]);

    useEffect(() => {
        contentService.getCourses().then(setCourses).catch(console.error);
    }, []);

    // Only show when authenticated
    if (!isAuthenticated || courses.length === 0) return null;

    const enrolledCourses = courses.filter((c) => enrolledCourseIds.includes(c.id));
    const activeCourse = activeCourseId
        ? courses.find((c) => c.id === activeCourseId)
        : null;

    return (
        <div className="flex items-center gap-1.5">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1.5 rounded-full px-3 text-xs font-medium"
                    >
                        <div className="flex h-5 w-5 items-center justify-center rounded-md bg-gradient-to-br from-solana-purple/15 to-solana-green/15">
                            <BookOpen className="h-3 w-3 text-solana-purple" />
                        </div>
                        <span className="hidden sm:inline max-w-[100px] truncate">
                            {activeCourse?.title || "All Courses"}
                        </span>
                        <ChevronDown className="h-3 w-3 text-muted-foreground" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="w-56">
                    {/* All courses option */}
                    <DropdownMenuItem
                        onClick={() => setActiveCourse(null)}
                        className={`flex items-center gap-2 ${!activeCourseId ? "font-bold text-foreground" : ""}`}
                    >
                        <BookOpen className="h-3.5 w-3.5" />
                        All Courses
                        {!activeCourseId && (
                            <span className="ml-auto text-[10px] text-solana-green">●</span>
                        )}
                    </DropdownMenuItem>

                    {enrolledCourses.length > 0 && <DropdownMenuSeparator />}

                    {/* Enrolled courses */}
                    {enrolledCourses.map((course) => (
                        <DropdownMenuItem
                            key={course.id}
                            onClick={() => setActiveCourse(course.id)}
                            className={`flex items-center gap-2 ${activeCourseId === course.id ? "font-bold text-foreground" : ""}`}
                        >
                            <BookOpen className="h-3.5 w-3.5" />
                            <span className="truncate">{course.title}</span>
                            {activeCourseId === course.id && (
                                <span className="ml-auto text-[10px] text-solana-green">●</span>
                            )}
                        </DropdownMenuItem>
                    ))}

                    <DropdownMenuSeparator />

                    {/* Add Course link */}
                    <div className="p-1">
                        <CoursePicker
                            courses={courses}
                            trigger={
                                <button className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
                                    <Plus className="h-3.5 w-3.5" />
                                    Add Course
                                </button>
                            }
                        />
                    </div>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}
