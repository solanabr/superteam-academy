"use client";

import { Link } from "@/i18n/routing";
import { useCourseStore } from "@/store/course-store";
import { useAppUser } from "@/hooks/useAppUser";
import { Lock } from "lucide-react";
import { useTranslations } from "next-intl";

interface Lesson {
    _id: string;
    title: string;
    lessonType?: string;
    sortOrder?: number;
}

interface Module {
    _id: string;
    title: string;
    sortOrder?: number;
    lessons: Lesson[];
}

interface ModuleListProps {
    courseId: string;
    courseSlug: string;
    modules: Module[];
}

export function ModuleList({ courseId, courseSlug, modules }: ModuleListProps) {
    const t = useTranslations("courses");
    const progress = useCourseStore((s) => s.progress);

    // Access strictly depends on enrollment (everyone must enroll)
    const hasAccess = !!progress;

    return (
        <div className="flex flex-col gap-4">
            {modules
                .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
                .map((mod, modIndex) => (
                    <div
                        key={mod._id}
                        className="glass-panel rounded-lg border p-4 border-white/5"
                    >
                        <h3 className="font-display text-text-primary font-medium">
                            {t("module_label", { index: modIndex + 1 })}: {mod.title}
                        </h3>
                        <ul className="mt-3 flex flex-col gap-2">
                            {(mod.lessons ?? [])
                                .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
                                .map((lesson) => (
                                    <li key={lesson._id}>
                                        {hasAccess ? (
                                            <Link
                                                href={`/courses/${courseSlug}/lessons/${lesson._id}`}
                                                className="text-text-secondary hover:text-solana flex items-center gap-2 text-sm transition-colors"
                                            >
                                                <span className="text-text-secondary shrink-0">
                                                    {lesson.lessonType === "challenge" ? "⌘" : "◦"}
                                                </span>
                                                {lesson.title}
                                            </Link>
                                        ) : (
                                            <div className="text-text-muted flex items-center gap-2 text-sm cursor-not-allowed opacity-60">
                                                <span className="shrink-0">
                                                    <Lock className="h-3 w-3" />
                                                </span>
                                                {lesson.title}
                                            </div>
                                        )}
                                    </li>
                                ))}
                        </ul>
                    </div>
                ))}
        </div>
    );
}
