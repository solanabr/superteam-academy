"use client";

import { useCourseFormStore, MAX_COURSE_XP } from "@/store/course-form-store";
import { AlertTriangle, Send, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const difficultyLabels: Record<string, string> = {
    beginner: "Beginner",
    intermediate: "Intermediate",
    advanced: "Advanced",
};

const trackLabels: Record<string, string> = {
    rust: "Rust",
    anchor: "Anchor",
    security: "Security",
    solana: "Solana",
    other: "Other",
};

interface CourseReviewProps {
    totalXp: number;
    xpOverBudget: boolean;
    onSubmit: () => Promise<void>;
    isSubmitting: boolean;
}

export function CourseReview({ totalXp, xpOverBudget, onSubmit, isSubmitting }: CourseReviewProps) {
    const store = useCourseFormStore();

    return (
        <div className="space-y-6">
            {/* XP warning */}
            {xpOverBudget && (
                <div className="rounded-xl border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/30 p-5 flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                    <div>
                        <p className="font-semibold text-red-700 dark:text-red-400">
                            XP Over Budget
                        </p>
                        <p className="text-sm text-red-600 dark:text-red-400">
                            Total XP is {totalXp} but the maximum is {MAX_COURSE_XP}.
                            Go back to Step 3 and reduce lesson XP values.
                        </p>
                    </div>
                </div>
            )}

            {/* Summary */}
            <div className="rounded-xl border bg-card p-6 space-y-4">
                <h2 className="font-semibold text-lg">Course Summary</h2>

                <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                        <p className="text-xs text-muted-foreground">Title</p>
                        <p className="font-medium">{store.title}</p>
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground">Difficulty</p>
                        <p className="font-medium capitalize">
                            {difficultyLabels[store.difficulty]}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground">Track</p>
                        <p className="font-medium">{trackLabels[store.trackId]}</p>
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground">Total Lessons</p>
                        <p className="font-medium">
                            {store.modules.reduce((acc, m) => acc + m.lessons.length, 0)}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground">Total XP</p>
                        <p className={`font-medium ${xpOverBudget ? "text-red-500" : "text-emerald-500"}`}>
                            {totalXp} / {MAX_COURSE_XP}
                        </p>
                    </div>
                </div>

                <div className="pt-4 flex items-center gap-4">
                    <Button
                        onClick={onSubmit}
                        disabled={isSubmitting || xpOverBudget || !store.title}
                        className="flex-1"
                    >
                        {isSubmitting ? (
                            <>
                                <Send className="h-4 w-4 mr-2 animate-pulse" />
                                Publishing...
                            </>
                        ) : (
                            <>
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                Publish Course
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
