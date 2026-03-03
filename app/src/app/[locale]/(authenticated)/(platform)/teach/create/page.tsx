"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAppUser } from "@/hooks/useAppUser";
import {
    useCourseFormStore,
    MAX_XP_PER_LESSON,
    MAX_COURSE_XP,
    type QuizQuestionDraft,
} from "@/store/course-form-store";
import { toast } from "sonner";
import {
    ArrowLeft,
    ArrowRight,
    Plus,
    Trash2,
    X,
    BookOpen,
    Layers,
    FileText,
    CheckCircle2,
    Send,
    Save,
    AlertTriangle,
    HelpCircle,
    Code2,
    ImagePlus,
    Loader2,
    Video,
} from "lucide-react";
import dynamic from "next/dynamic";

const QuizEditor = dynamic(() => import("@/components/teach/QuizEditor").then(m => m.QuizEditor), { ssr: false });
const ChallengeEditor = dynamic(() => import("@/components/teach/ChallengeEditor").then(m => m.ChallengeEditor), { ssr: false });
const CourseReview = dynamic(() => import("@/components/teach/CourseReview").then(m => m.CourseReview), { ssr: false });

// Local constants instead of importing from lib/constants
const difficultyLabels: Record<"beginner" | "intermediate" | "advanced", string> = {
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

const steps = [
    { id: 1, title: "Course Info", icon: BookOpen },
    { id: 2, title: "Modules", icon: Layers },
    { id: 3, title: "Lessons", icon: FileText },
    { id: 4, title: "Review & Submit", icon: Send },
];

// Components extracted to @/components/teach/*
// QuizEditor and ChallengeEditor were here as local functions


export default function CreateCoursePage() {
    const router = useRouter();
    const store = useCourseFormStore();
    const [submitting, setSubmitting] = useState(false);
    const [whatYouLearnInput, setWhatYouLearnInput] = useState("");
    const { user } = useAppUser();

    const totalLessons = store.modules.reduce(
        (sum, m) => sum + m.lessons.length,
        0,
    );
    const totalXp = store.modules.reduce(
        (sum, m) => sum + m.lessons.reduce((ls, l) => ls + l.xp, 0),
        0,
    );
    const xpOverBudget = totalXp > MAX_COURSE_XP;

    const handleSubmit = async (publishImmediately: boolean) => {
        if (xpOverBudget) {
            toast.error(
                `Total course XP (${totalXp}) exceeds maximum of ${MAX_COURSE_XP}`,
            );
            return;
        }

        if (!user?.walletAddress) {
            toast.error("You must be logged in with a wallet to create a course.");
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                title: store.title,
                description: store.description,
                difficulty: store.difficulty,
                track: store.trackId,
                duration: store.duration,
                xpPerLesson: store.xpPerLesson,
                modules: store.modules,
                whatYouLearn: store.whatYouLearn,
                instructor: store.instructorName || undefined,
                wallet: user.walletAddress,
                published: publishImmediately
            };

            const res = await fetch("/api/courses/create", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                toast.success(publishImmediately ? "Course submitted & synced!" : "Course draft saved to Sanity!");
                if (publishImmediately) {
                    router.push("/teach/courses");
                }
            } else {
                const { error, details } = await res.json();
                toast.error(error ?? "Failed to save draft");
                if (details) console.error(details);
            }
        } catch {
            toast.error("Failed to save due to an unexpected error.");
        } finally {
            setSubmitting(false);
        }
    };

    const canProceed = () => {
        switch (store.currentStep) {
            case 1:
                return store.title.trim() && store.description.trim();
            case 2:
                return (
                    store.modules.length > 0 && store.modules.every((m) => m.title.trim())
                );
            case 3:
                return store.modules.every(
                    (m) =>
                        m.lessons.length > 0 && m.lessons.every((l) => l.title.trim()),
                );
            default:
                return true;
        }
    };

    if (!user || (user.role !== "admin" && user.role !== "professor")) {
        return (
            <div className="container mx-auto px-4 py-8 lg:py-12 max-w-5xl text-center">
                <h1 className="text-2xl font-bold">Unauthorized</h1>
                <p className="text-muted-foreground">Only professors and admins can access this page.</p>
            </div>
        );
    }

    return (
        <div className="w-full max-w-[1920px] mx-auto px-6 py-8 lg:py-12">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">
                    Create a Course
                </h1>
                <p className="text-muted-foreground mt-1">
                    Share your knowledge with the Solana community
                </p>
            </div>

            {/* Step indicator */}
            <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
                {steps.map((step, i) => {
                    const isActive = store.currentStep === step.id;
                    const isDone = store.currentStep > step.id;
                    return (
                        <div key={step.id} className="flex items-center gap-2">
                            {i > 0 && (
                                <div
                                    className={`h-px w-8 ${isDone ? "bg-primary" : "bg-border"}`}
                                />
                            )}
                            <button
                                onClick={() => isDone && store.setStep(step.id)}
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${isActive
                                    ? "bg-primary text-primary-foreground"
                                    : isDone
                                        ? "bg-primary/10 text-primary cursor-pointer"
                                        : "bg-muted text-muted-foreground"
                                    }`}
                            >
                                {isDone ? (
                                    <CheckCircle2 className="h-4 w-4" />
                                ) : (
                                    <step.icon className="h-4 w-4" />
                                )}
                                {step.title}
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* ───── Step 1: Course Info ───── */}
            {store.currentStep === 1 && (
                <div className="space-y-6">
                    <div className="rounded-xl border bg-card p-6 space-y-5">
                        <h2 className="font-semibold text-lg">Basic Information</h2>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Course Title *</label>
                            <Input
                                value={store.title}
                                onChange={(e) => store.setField("title", e.target.value)}
                                placeholder="e.g. Building PDAs with Anchor"
                                className="h-11"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Description *</label>
                            <textarea
                                value={store.description}
                                onChange={(e) =>
                                    store.setField("description", e.target.value)
                                }
                                placeholder="What will learners gain from this course?"
                                rows={4}
                                className="w-full rounded-lg border bg-background px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Difficulty *</label>
                                <div className="flex gap-2">
                                    {(Object.keys(difficultyLabels) as Array<"beginner" | "intermediate" | "advanced">).map((d) => (
                                        <Button
                                            key={d}
                                            variant={store.difficulty === d ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => store.setField("difficulty", d)}
                                            className="capitalize"
                                        >
                                            {difficultyLabels[d]}
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Track</label>
                                <select
                                    value={store.trackId}
                                    onChange={(e) =>
                                        store.setField("trackId", e.target.value)
                                    }
                                    className="w-full h-9 rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                >
                                    {Object.entries(trackLabels).map(([id, label]) => (
                                        <option key={id} value={id}>
                                            {label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">
                                    Estimated Duration
                                </label>
                                <Input
                                    value={store.duration}
                                    onChange={(e) =>
                                        store.setField("duration", e.target.value)
                                    }
                                    placeholder='e.g. "4 hours", "2 weeks"'
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">
                                    XP Per Lesson (max {MAX_XP_PER_LESSON})
                                </label>
                                <Input
                                    type="number"
                                    value={store.xpPerLesson}
                                    onChange={(e) =>
                                        store.setField(
                                            "xpPerLesson",
                                            Math.min(
                                                MAX_XP_PER_LESSON,
                                                Math.max(1, Number(e.target.value)),
                                            ),
                                        )
                                    }
                                    min={1}
                                    max={MAX_XP_PER_LESSON}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Instructor */}
                    <div className="rounded-xl border bg-card p-6 space-y-5">
                        <h2 className="font-semibold text-lg">Instructor</h2>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Name</label>
                                <Input
                                    value={store.instructorName}
                                    onChange={(e) =>
                                        store.setField("instructorName", e.target.value)
                                    }
                                    placeholder="Your name or alias"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Bio</label>
                                <Input
                                    value={store.instructorBio}
                                    onChange={(e) =>
                                        store.setField("instructorBio", e.target.value)
                                    }
                                    placeholder="Short bio"
                                />
                            </div>
                        </div>
                    </div>

                    {/* What You'll Learn */}
                    <div className="rounded-xl border bg-card p-6 space-y-4">
                        <h2 className="font-semibold text-lg">
                            What You&apos;ll Learn
                        </h2>
                        <div className="flex gap-2">
                            <Input
                                value={whatYouLearnInput}
                                onChange={(e) => setWhatYouLearnInput(e.target.value)}
                                placeholder="Add a learning objective"
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && whatYouLearnInput.trim()) {
                                        store.addWhatYouLearn(whatYouLearnInput.trim());
                                        setWhatYouLearnInput("");
                                    }
                                }}
                            />
                            <Button
                                variant="outline"
                                onClick={() => {
                                    if (whatYouLearnInput.trim()) {
                                        store.addWhatYouLearn(whatYouLearnInput.trim());
                                        setWhatYouLearnInput("");
                                    }
                                }}
                            >
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                        {store.whatYouLearn.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {store.whatYouLearn.map((item, i) => (
                                    <Badge
                                        key={i}
                                        variant="secondary"
                                        className="gap-1 pr-1"
                                    >
                                        {item}
                                        <button onClick={() => store.removeWhatYouLearn(i)}>
                                            <X className="h-3 w-3" />
                                        </button>
                                    </Badge>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ───── Step 2: Modules ───── */}
            {store.currentStep === 2 && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="font-semibold text-lg">
                            Modules ({store.modules.length})
                        </h2>
                        <Button variant="outline" size="sm" onClick={store.addModule}>
                            <Plus className="h-4 w-4 mr-1" />
                            Add Module
                        </Button>
                    </div>

                    {store.modules.map((mod, mi) => (
                        <div
                            key={mi}
                            className="rounded-xl border bg-card p-5 space-y-4"
                        >
                            <div className="flex items-center justify-between">
                                <h3 className="font-medium text-sm text-muted-foreground">
                                    Module {mi + 1}
                                </h3>
                                {store.modules.length > 1 && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => store.removeModule(mi)}
                                        className="text-destructive hover:text-destructive"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                            <div className="space-y-3">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium">Title *</label>
                                    <Input
                                        value={mod.title}
                                        onChange={(e) =>
                                            store.updateModule(mi, "title", e.target.value)
                                        }
                                        placeholder={`Module ${mi + 1} title`}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium">Description</label>
                                    <textarea
                                        value={mod.description}
                                        onChange={(e) =>
                                            store.updateModule(mi, "description", e.target.value)
                                        }
                                        placeholder="Brief description of this module"
                                        rows={2}
                                        className="w-full rounded-lg border bg-background px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-ring"
                                    />
                                </div>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {mod.lessons.length} lesson
                                {mod.lessons.length !== 1 ? "s" : ""}
                            </p>
                        </div>
                    ))}
                </div>
            )}

            {/* ───── Step 3: Lessons ───── */}
            {store.currentStep === 3 && (
                <div className="space-y-6">
                    {/* XP budget bar */}
                    <div
                        className={`rounded-xl border p-4 ${xpOverBudget ? "border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/30" : "bg-card"}`}
                    >
                        <div className="flex items-center justify-between text-sm mb-2">
                            <span className="font-medium flex items-center gap-2">
                                {xpOverBudget && (
                                    <AlertTriangle className="h-4 w-4 text-red-500" />
                                )}
                                XP Budget
                            </span>
                            <span
                                className={`font-mono font-semibold ${xpOverBudget ? "text-red-600 dark:text-red-400" : ""}`}
                            >
                                {totalXp} / {MAX_COURSE_XP} XP
                            </span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all ${xpOverBudget ? "bg-red-500" : "bg-primary"}`}
                                style={{
                                    width: `${Math.min(100, (totalXp / MAX_COURSE_XP) * 100)}%`,
                                }}
                            />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1.5">
                            {totalLessons} lesson{totalLessons !== 1 ? "s" : ""} · Max{" "}
                            {MAX_XP_PER_LESSON} XP per lesson · Max {MAX_COURSE_XP} XP
                            total
                        </p>
                    </div>

                    {store.modules.map((mod, mi) => (
                        <div key={mi} className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold">
                                    Module {mi + 1}: {mod.title || "(untitled)"}
                                </h3>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => store.addLesson(mi)}
                                >
                                    <Plus className="h-4 w-4 mr-1" />
                                    Add Lesson
                                </Button>
                            </div>

                            {mod.lessons.map((les, li) => (
                                <div
                                    key={li}
                                    className="rounded-xl border bg-card p-4 space-y-3"
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-mono text-muted-foreground">
                                            Lesson {mi + 1}.{li + 1}
                                        </span>
                                        {mod.lessons.length > 1 && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => store.removeLesson(mi, li)}
                                                className="text-destructive hover:text-destructive h-7 px-2"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        )}
                                    </div>

                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-medium">Title *</label>
                                            <Input
                                                value={les.title}
                                                onChange={(e) =>
                                                    store.updateLesson(
                                                        mi,
                                                        li,
                                                        "title",
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder="Lesson title"
                                                className="h-9"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-medium">Type</label>
                                            <select
                                                value={les.type}
                                                onChange={(e) =>
                                                    store.updateLesson(
                                                        mi,
                                                        li,
                                                        "type",
                                                        e.target.value,
                                                    )
                                                }
                                                className="w-full h-9 rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                            >
                                                <option value="content">Content</option>
                                                <option value="challenge">Challenge</option>
                                                <option value="video">Video</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium">
                                            Description
                                        </label>
                                        <Input
                                            value={les.description}
                                            onChange={(e) =>
                                                store.updateLesson(
                                                    mi,
                                                    li,
                                                    "description",
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="Brief lesson summary"
                                            className="h-9"
                                        />
                                    </div>

                                    {/* Content editor — only for "content" type */}
                                    {les.type === "content" && (
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-medium">
                                                Lesson Content
                                            </label>
                                            <textarea
                                                value={les.content}
                                                onChange={(e) =>
                                                    store.updateLesson(
                                                        mi,
                                                        li,
                                                        "content",
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder="Write your lesson content here... (Markdown supported)"
                                                rows={6}
                                                className="w-full rounded-lg border bg-background px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-ring"
                                            />
                                        </div>
                                    )}

                                    {/* Video lesson */}
                                    {les.type === "video" && (
                                        <div className="space-y-3">
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-medium flex items-center gap-1.5">
                                                    <Video className="h-3.5 w-3.5 text-red-500" />
                                                    YouTube Video URL *
                                                </label>
                                                <Input
                                                    value={les.videoUrl}
                                                    onChange={(e) =>
                                                        store.updateLesson(
                                                            mi,
                                                            li,
                                                            "videoUrl",
                                                            e.target.value,
                                                        )
                                                    }
                                                    placeholder="https://www.youtube.com/watch?v=..."
                                                    className="h-9"
                                                />
                                                <p className="text-[11px] text-muted-foreground">
                                                    Supports youtube.com/watch, youtu.be, and youtube.com/embed URLs
                                                </p>
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-medium">
                                                    Lesson Content (optional)
                                                </label>
                                                <textarea
                                                    value={les.content}
                                                    onChange={(e) =>
                                                        store.updateLesson(
                                                            mi,
                                                            li,
                                                            "content",
                                                            e.target.value,
                                                        )
                                                    }
                                                    placeholder="Additional notes or context for this video lesson..."
                                                    rows={4}
                                                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-ring"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Challenge builder */}
                                    {les.type === "challenge" && (
                                        <ChallengeEditor mi={mi} li={li} />
                                    )}

                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-medium">
                                                XP Reward (max {MAX_XP_PER_LESSON})
                                            </label>
                                            <Input
                                                type="number"
                                                value={les.xp}
                                                onChange={(e) =>
                                                    store.updateLesson(
                                                        mi,
                                                        li,
                                                        "xp",
                                                        Number(e.target.value),
                                                    )
                                                }
                                                min={0}
                                                max={MAX_XP_PER_LESSON}
                                                className="h-9"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-medium">
                                                Duration
                                            </label>
                                            <Input
                                                value={les.duration}
                                                onChange={(e) =>
                                                    store.updateLesson(
                                                        mi,
                                                        li,
                                                        "duration",
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder="e.g. 15 min"
                                                className="h-9"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {/* Module Quiz Setup */}
                            <div className="mt-6 pt-6 border-t border-violet-100 dark:border-violet-900/30">
                                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                    <Layers className="h-4 w-4" />
                                    Module {mi + 1} Knowledge Check (Quiz)
                                </h4>
                                <QuizEditor mi={mi} />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {store.currentStep === 4 && (
                <CourseReview
                    totalXp={totalXp}
                    xpOverBudget={xpOverBudget}
                    onSubmit={() => handleSubmit(true)}
                    isSubmitting={submitting}
                />
            )}

            {/* Navigation buttons */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t">
                <Button
                    variant="outline"
                    onClick={() => store.setStep(store.currentStep - 1)}
                    disabled={store.currentStep === 1}
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Previous
                </Button>

                <div className="flex gap-2">
                    {store.currentStep === 4 ? (
                        <>
                            <Button
                                variant="outline"
                                onClick={() => handleSubmit(false)}
                                disabled={submitting || xpOverBudget}
                            >
                                <Save className="h-4 w-4 mr-2" />
                                {submitting ? "Saving Draft..." : "Save Draft"}
                            </Button>
                            <Button
                                onClick={() => handleSubmit(true)}
                                disabled={submitting || xpOverBudget}
                            >
                                {submitting ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                    <Send className="h-4 w-4 mr-2" />
                                )}
                                {submitting ? "Publishing..." : "Publish Course!"}
                            </Button>
                        </>
                    ) : (
                        <Button
                            onClick={() => store.setStep(store.currentStep + 1)}
                            disabled={!canProceed()}
                        >
                            Next
                            <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
