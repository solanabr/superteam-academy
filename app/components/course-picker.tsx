"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useEnrollment } from "@/lib/enrollment-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Search, Check, Zap, Clock, BookOpen, GraduationCap } from "lucide-react";
import type { Course } from "@/lib/types";

const difficultyColors: Record<string, string> = {
    beginner: "bg-green-500/10 text-green-500 border-green-500/20",
    intermediate: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    advanced: "bg-orange-500/10 text-orange-500 border-orange-500/20",
    expert: "bg-red-500/10 text-red-500 border-red-500/20",
};

interface CoursePickerProps {
    courses: Course[];
    trigger?: React.ReactNode;
}

export function CoursePicker({ courses, trigger }: CoursePickerProps) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const { enrollInCourse, isEnrolled } = useEnrollment();

    const filtered = courses.filter(
        (c) =>
            c.title.toLowerCase().includes(search.toLowerCase()) ||
            c.track.toLowerCase().includes(search.toLowerCase())
    );

    const enrolled = filtered.filter((c) => isEnrolled(c.id));
    const available = filtered.filter((c) => !isEnrolled(c.id));

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 rounded-full border-dashed border-solana-purple/30 text-solana-purple hover:bg-solana-purple/5 hover:border-solana-purple/50"
                    >
                        <Plus className="h-3.5 w-3.5" />
                        Add Course
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="max-h-[80vh] overflow-hidden sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="font-display text-xl flex items-center gap-2">
                        <GraduationCap className="h-5 w-5 text-solana-purple" />
                        Choose a Course
                    </DialogTitle>
                </DialogHeader>

                {/* Search */}
                <div className="relative mt-2">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Search courses..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 rounded-full"
                    />
                </div>

                {/* Course List */}
                <div className="mt-3 max-h-[50vh] overflow-y-auto space-y-2 pr-1">
                    {enrolled.length > 0 && (
                        <div>
                            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
                                Currently Learning
                            </p>
                            {enrolled.map((course) => (
                                <CoursePickerCard
                                    key={course.id}
                                    course={course}
                                    enrolled={true}
                                    onEnroll={() => { }}
                                />
                            ))}
                        </div>
                    )}

                    {available.length > 0 && (
                        <div>
                            {enrolled.length > 0 && (
                                <p className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
                                    Available Courses
                                </p>
                            )}
                            {available.map((course) => (
                                <CoursePickerCard
                                    key={course.id}
                                    course={course}
                                    enrolled={false}
                                    onEnroll={() => {
                                        enrollInCourse(course.id);
                                    }}
                                />
                            ))}
                        </div>
                    )}

                    {filtered.length === 0 && (
                        <div className="py-8 text-center text-sm text-muted-foreground">
                            No courses found.
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

function CoursePickerCard({
    course,
    enrolled,
    onEnroll,
}: {
    course: Course;
    enrolled: boolean;
    onEnroll: () => void;
}) {
    return (
        <div
            className={`flex items-center gap-3 rounded-xl border p-3 transition-all ${enrolled
                    ? "border-solana-purple/20 bg-solana-purple/5"
                    : "border-border/60 hover:border-border hover:bg-accent/50 cursor-pointer"
                }`}
            onClick={enrolled ? undefined : onEnroll}
        >
            {/* Icon */}
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-solana-purple/10 to-solana-green/10">
                <BookOpen className="h-4 w-4 text-solana-purple" />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold truncate">{course.title}</p>
                    {enrolled && <Check className="h-3.5 w-3.5 text-solana-green shrink-0" />}
                </div>
                <div className="mt-1 flex items-center gap-2">
                    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-4 ${difficultyColors[course.difficulty]}`}>
                        {course.difficulty}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                        <Clock className="h-2.5 w-2.5" />{course.duration}
                    </span>
                    <span className="text-[10px] text-solana-green flex items-center gap-0.5">
                        <Zap className="h-2.5 w-2.5" />+{course.xpReward}
                    </span>
                </div>
            </div>

            {/* Action */}
            {!enrolled && (
                <Button
                    size="sm"
                    variant="ghost"
                    className="shrink-0 h-7 rounded-full text-xs text-solana-purple hover:bg-solana-purple/10"
                    onClick={(e) => {
                        e.stopPropagation();
                        onEnroll();
                    }}
                >
                    <Plus className="h-3 w-3 mr-1" />
                    Add
                </Button>
            )}
        </div>
    );
}
