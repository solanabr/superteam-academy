import { CourseData } from "@/lib/courses";
import Link from "next/link";
import { BookOpen, Zap, Clock, ChevronRight, Lock } from "lucide-react";

interface CourseCardProps {
    course: CourseData;
    enrolled?: boolean;
    completed?: boolean;
    progress?: number;
}

const TRACK_COLORS: Record<string, string> = {
    anchor: "text-purple-400 bg-purple-400/10",
    defi: "text-blue-400 bg-blue-400/10",
    nft: "text-pink-400 bg-pink-400/10",
    core: "text-green-400 bg-green-400/10",
};

const LEVEL_COLORS: Record<string, string> = {
    beginner: "text-green-400 bg-green-400/10",
    intermediate: "text-yellow-400 bg-yellow-400/10",
    advanced: "text-red-400 bg-red-400/10",
};

export function CourseCard({ course, enrolled, completed, progress }: CourseCardProps) {
    const trackColor = TRACK_COLORS[course.track] ?? "text-gray-400 bg-gray-400/10";
    const levelColor = LEVEL_COLORS[course.level] ?? "text-gray-400 bg-gray-400/10";
    const totalXP = course.xpPerLesson * course.lessonCount + course.completionBonus;

    return (
        <Link
            href={`/courses/${course.slug}`}
            className="group block glass rounded-xl overflow-hidden hover:border-[hsl(var(--primary)/0.5)] transition-all duration-300 hover:shadow-[var(--glow-purple)] hover:-translate-y-1"
        >
            {/* Thumbnail */}
            <div className="relative h-44 overflow-hidden bg-[hsl(var(--muted))]">
                <img
                    src={course.thumbnail}
                    alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[hsl(var(--card))] to-transparent" />

                {/* Badges */}
                <div className="absolute top-3 left-3 flex gap-2">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-md ${trackColor}`}>
                        {course.track.toUpperCase()}
                    </span>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-md ${levelColor}`}>
                        {course.level}
                    </span>
                </div>

                {course.startingSoon && (
                    <div className="absolute top-3 right-3 text-xs font-semibold px-2 py-1 rounded-md bg-orange-400/20 text-orange-400">
                        Starting Soon
                    </div>
                )}
                {completed && (
                    <div className="absolute top-3 right-3 text-xs font-semibold px-2 py-1 rounded-md bg-green-400/20 text-green-400">
                        ✓ Completed
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-5">
                <h3 className="font-heading font-semibold text-base mb-1 group-hover:text-[hsl(var(--primary))] transition-colors line-clamp-2">
                    {course.title}
                </h3>
                <p className="text-sm text-[hsl(var(--muted-foreground))] line-clamp-2 mb-4">
                    {course.description}
                </p>

                {/* Progress bar */}
                {enrolled && progress !== undefined && !completed && (
                    <div className="mb-4">
                        <div className="flex justify-between text-xs text-[hsl(var(--muted-foreground))] mb-1">
                            <span>Progress</span>
                            <span>{progress}%</span>
                        </div>
                        <div className="h-1.5 bg-[hsl(var(--muted))] rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-purple-500 to-green-400 rounded-full transition-all"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between text-xs text-[hsl(var(--muted-foreground))]">
                    <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                            <BookOpen className="w-3.5 h-3.5" />
                            {course.lessonCount} lessons
                        </span>
                        <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {course.duration}
                        </span>
                    </div>
                    <span className="flex items-center gap-1 text-green-400 font-semibold">
                        <Zap className="w-3.5 h-3.5" />
                        {totalXP.toLocaleString()} XP
                    </span>
                </div>

                {/* Prerequisite lock */}
                {course.prerequisiteId && !enrolled && (
                    <div className="mt-3 flex items-center gap-1.5 text-xs text-[hsl(var(--muted-foreground))]">
                        <Lock className="w-3 h-3" />
                        Requires prerequisite course
                    </div>
                )}

                {/* CTA */}
                <div className="mt-4 flex items-center gap-1 text-sm font-semibold text-[hsl(var(--primary))] group-hover:gap-2 transition-all">
                    {completed ? "View Certificate" : enrolled ? "Continue Learning" : "View Course"}
                    <ChevronRight className="w-4 h-4" />
                </div>
            </div>
        </Link>
    );
}
