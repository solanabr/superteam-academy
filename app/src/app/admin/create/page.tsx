"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    ArrowLeft,
    Plus,
    Trash2,
    GripVertical,
    Save,
    Eye,
    BookOpen,
    FileText,
    Code,
    Image,
    Video,
    CheckCircle2,
    ChevronDown,
    ChevronRight,
} from "lucide-react";
import Link from "next/link";

type LessonType = "text" | "video" | "code-challenge" | "quiz";

type Lesson = {
    id: string;
    title: string;
    type: LessonType;
    content: string;
    duration: string;
    xpReward: number;
};

type Module = {
    id: string;
    title: string;
    description: string;
    lessons: Lesson[];
    isExpanded: boolean;
};

const LESSON_TYPE_META: Record<LessonType, { label: string; icon: React.ElementType; color: string }> = {
    text: { label: "Text Lesson", icon: FileText, color: "text-blue-400" },
    video: { label: "Video Lesson", icon: Video, color: "text-purple-400" },
    "code-challenge": { label: "Code Challenge", icon: Code, color: "text-green-400" },
    quiz: { label: "Quiz", icon: CheckCircle2, color: "text-yellow-400" },
};

const TRACKS = ["Solana Core", "DeFi", "NFTs & Gaming", "Anchor", "Token-2022"];
const DIFFICULTIES = ["Beginner", "Intermediate", "Advanced"];

let idCounter = 0;
function genId() {
    return `item_${++idCounter}_${Date.now()}`;
}

export default function CourseCreatorPage() {
    const router = useRouter();

    // Course metadata
    const [courseTitle, setCourseTitle] = useState("");
    const [courseDescription, setCourseDescription] = useState("");
    const [courseTrack, setCourseTrack] = useState(TRACKS[0]);
    const [courseDifficulty, setCourseDifficulty] = useState(DIFFICULTIES[0]);
    const [courseThumbnail, setCourseThumbnail] = useState("");
    const [coursePrereqs, setCoursePrereqs] = useState("");

    // Modules
    const [modules, setModules] = useState<Module[]>([
        {
            id: genId(),
            title: "Module 1: Introduction",
            description: "",
            isExpanded: true,
            lessons: [
                { id: genId(), title: "Welcome & Setup", type: "text", content: "", duration: "10", xpReward: 50 },
            ],
        },
    ]);

    const [isSaving, setIsSaving] = useState(false);

    const addModule = () => {
        setModules((prev) => [
            ...prev,
            {
                id: genId(),
                title: `Module ${prev.length + 1}`,
                description: "",
                isExpanded: true,
                lessons: [],
            },
        ]);
    };

    const removeModule = (moduleId: string) => {
        setModules((prev) => prev.filter((m) => m.id !== moduleId));
    };

    const toggleModule = (moduleId: string) => {
        setModules((prev) =>
            prev.map((m) => (m.id === moduleId ? { ...m, isExpanded: !m.isExpanded } : m))
        );
    };

    const updateModule = (moduleId: string, field: keyof Module, value: string) => {
        setModules((prev) =>
            prev.map((m) => (m.id === moduleId ? { ...m, [field]: value } : m))
        );
    };

    const addLesson = (moduleId: string) => {
        setModules((prev) =>
            prev.map((m) =>
                m.id === moduleId
                    ? {
                        ...m,
                        lessons: [
                            ...m.lessons,
                            { id: genId(), title: "", type: "text" as LessonType, content: "", duration: "10", xpReward: 50 },
                        ],
                    }
                    : m
            )
        );
    };

    const removeLesson = (moduleId: string, lessonId: string) => {
        setModules((prev) =>
            prev.map((m) =>
                m.id === moduleId ? { ...m, lessons: m.lessons.filter((l) => l.id !== lessonId) } : m
            )
        );
    };

    const updateLesson = (moduleId: string, lessonId: string, field: keyof Lesson, value: string | number) => {
        setModules((prev) =>
            prev.map((m) =>
                m.id === moduleId
                    ? {
                        ...m,
                        lessons: m.lessons.map((l) =>
                            l.id === lessonId ? { ...l, [field]: value } : l
                        ),
                    }
                    : m
            )
        );
    };

    const handleSave = async (status: "draft" | "published") => {
        setIsSaving(true);
        // Simulate API call
        await new Promise((r) => setTimeout(r, 1500));
        setIsSaving(false);
        router.push("/admin");
    };

    const totalLessons = modules.reduce((acc, m) => acc + m.lessons.length, 0);
    const totalXP = modules.reduce((acc, m) => acc + m.lessons.reduce((la, l) => la + l.xpReward, 0), 0);

    return (
        <div className="min-h-screen bg-background noise-bg">
            {/* Header */}
            <div className="border-b border-border bg-black/40 backdrop-blur-sm sticky top-0 z-40">
                <div className="mx-auto max-w-5xl px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/admin" className="text-muted-foreground hover:text-foreground transition-colors">
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                        <div>
                            <h1 className="text-lg font-display font-bold uppercase tracking-wider text-foreground">Course Creator</h1>
                            <p className="text-[10px] font-mono text-muted-foreground">{"// "}CMS — Create & manage course content</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="rounded-none border-border font-mono text-xs uppercase"
                            onClick={() => handleSave("draft")}
                            disabled={isSaving}
                        >
                            <Save className="h-3 w-3 mr-1" />
                            Save Draft
                        </Button>
                        <Button
                            size="sm"
                            className="rounded-none bg-primary text-black font-mono text-xs uppercase font-bold"
                            onClick={() => handleSave("published")}
                            disabled={isSaving || !courseTitle}
                        >
                            {isSaving ? "Saving..." : "Publish"}
                        </Button>
                    </div>
                </div>
            </div>

            <div className="mx-auto max-w-5xl px-6 py-8 space-y-8">
                {/* ── Course Metadata ── */}
                <Card className="border-border bg-card/5 rounded-none">
                    <CardHeader>
                        <CardTitle className="font-mono text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                            <BookOpen className="h-4 w-4 text-primary" />
                            Course Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1 block">Course Title *</label>
                                <Input
                                    value={courseTitle}
                                    onChange={(e) => setCourseTitle(e.target.value)}
                                    placeholder="e.g. Solana 101: Building Your First dApp"
                                    className="rounded-none border-border bg-black/40 font-space"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1 block">Description</label>
                                <textarea
                                    value={courseDescription}
                                    onChange={(e) => setCourseDescription(e.target.value)}
                                    placeholder="Describe what students will learn in this course..."
                                    rows={3}
                                    className="w-full rounded-none border border-border bg-black/40 font-space text-sm px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1 block">Track</label>
                                <select
                                    value={courseTrack}
                                    onChange={(e) => setCourseTrack(e.target.value)}
                                    className="w-full rounded-none border border-border bg-black/40 font-mono text-sm px-3 py-2 text-foreground focus:outline-none focus:border-primary/50"
                                >
                                    {TRACKS.map((t) => (
                                        <option key={t} value={t}>{t}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1 block">Difficulty</label>
                                <select
                                    value={courseDifficulty}
                                    onChange={(e) => setCourseDifficulty(e.target.value)}
                                    className="w-full rounded-none border border-border bg-black/40 font-mono text-sm px-3 py-2 text-foreground focus:outline-none focus:border-primary/50"
                                >
                                    {DIFFICULTIES.map((d) => (
                                        <option key={d} value={d}>{d}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1 block">Thumbnail URL</label>
                                <Input
                                    value={courseThumbnail}
                                    onChange={(e) => setCourseThumbnail(e.target.value)}
                                    placeholder="https://..."
                                    className="rounded-none border-border bg-black/40 font-mono text-sm"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1 block">Prerequisites</label>
                                <Input
                                    value={coursePrereqs}
                                    onChange={(e) => setCoursePrereqs(e.target.value)}
                                    placeholder="e.g. Basic Rust knowledge"
                                    className="rounded-none border-border bg-black/40 font-space text-sm"
                                />
                            </div>
                        </div>

                        {/* Stats preview */}
                        <div className="flex gap-4 pt-4 border-t border-border">
                            {[
                                { label: "Modules", value: modules.length },
                                { label: "Lessons", value: totalLessons },
                                { label: "Total XP", value: totalXP },
                            ].map((s) => (
                                <div key={s.label} className="text-center px-4">
                                    <p className="text-lg font-display font-bold text-foreground">{s.value}</p>
                                    <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{s.label}</p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* ── Modules ── */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Curriculum Builder</h2>
                        <Button
                            size="sm"
                            variant="outline"
                            className="rounded-none border-border font-mono text-xs uppercase"
                            onClick={addModule}
                        >
                            <Plus className="h-3 w-3 mr-1" />
                            Add Module
                        </Button>
                    </div>

                    {modules.map((mod, modIdx) => (
                        <motion.div
                            key={mod.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: modIdx * 0.05 }}
                        >
                            <Card className="border-border bg-card/5 rounded-none">
                                {/* Module Header */}
                                <div
                                    className="flex items-center gap-3 px-4 py-3 border-b border-border cursor-pointer hover:bg-secondary/10 transition-colors"
                                    onClick={() => toggleModule(mod.id)}
                                >
                                    <GripVertical className="h-4 w-4 text-muted-foreground/50" />
                                    {mod.isExpanded ? (
                                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                    ) : (
                                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                    )}
                                    <Input
                                        value={mod.title}
                                        onChange={(e) => updateModule(mod.id, "title", e.target.value)}
                                        onClick={(e) => e.stopPropagation()}
                                        className="rounded-none border-transparent bg-transparent font-display font-bold text-foreground focus:border-primary/50 flex-1 h-8"
                                    />
                                    <Badge variant="outline" className="rounded-none text-[10px] font-mono text-muted-foreground border-border">
                                        {mod.lessons.length} lessons
                                    </Badge>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            removeModule(mod.id);
                                        }}
                                        className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>

                                {/* Lessons */}
                                {mod.isExpanded && (
                                    <CardContent className="p-4 space-y-3">
                                        <Input
                                            value={mod.description}
                                            onChange={(e) => updateModule(mod.id, "description", e.target.value)}
                                            placeholder="Module description (optional)"
                                            className="rounded-none border-border bg-black/20 font-space text-sm mb-3"
                                        />

                                        {mod.lessons.map((lesson, lessonIdx) => {
                                            const meta = LESSON_TYPE_META[lesson.type];
                                            return (
                                                <div
                                                    key={lesson.id}
                                                    className="flex items-start gap-3 p-3 border border-border/50 bg-black/20 group"
                                                >
                                                    <span className="text-[10px] font-mono text-muted-foreground/50 mt-2 w-6 text-right">
                                                        {lessonIdx + 1}.
                                                    </span>
                                                    <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-2">
                                                        <div className="md:col-span-5">
                                                            <Input
                                                                value={lesson.title}
                                                                onChange={(e) => updateLesson(mod.id, lesson.id, "title", e.target.value)}
                                                                placeholder="Lesson title"
                                                                className="rounded-none border-border bg-black/30 font-space text-sm h-8"
                                                            />
                                                        </div>
                                                        <div className="md:col-span-3">
                                                            <select
                                                                value={lesson.type}
                                                                onChange={(e) => updateLesson(mod.id, lesson.id, "type", e.target.value)}
                                                                className="w-full rounded-none border border-border bg-black/30 font-mono text-xs px-2 py-1.5 text-foreground h-8"
                                                            >
                                                                {Object.entries(LESSON_TYPE_META).map(([key, val]) => (
                                                                    <option key={key} value={key}>{val.label}</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                        <div className="md:col-span-2">
                                                            <div className="flex items-center gap-1">
                                                                <Input
                                                                    type="number"
                                                                    value={lesson.duration}
                                                                    onChange={(e) => updateLesson(mod.id, lesson.id, "duration", e.target.value)}
                                                                    className="rounded-none border-border bg-black/30 font-mono text-xs h-8 w-full"
                                                                />
                                                                <span className="text-[10px] font-mono text-muted-foreground whitespace-nowrap">min</span>
                                                            </div>
                                                        </div>
                                                        <div className="md:col-span-2">
                                                            <div className="flex items-center gap-1">
                                                                <Input
                                                                    type="number"
                                                                    value={lesson.xpReward}
                                                                    onChange={(e) => updateLesson(mod.id, lesson.id, "xpReward", parseInt(e.target.value) || 0)}
                                                                    className="rounded-none border-border bg-black/30 font-mono text-xs h-8 w-full"
                                                                />
                                                                <span className="text-[10px] font-mono text-muted-foreground whitespace-nowrap">XP</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => removeLesson(mod.id, lesson.id)}
                                                        className="p-1 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                                                    >
                                                        <Trash2 className="h-3 w-3" />
                                                    </button>
                                                </div>
                                            );
                                        })}

                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="rounded-none border-dashed border-border font-mono text-xs uppercase w-full hover:border-primary/50"
                                            onClick={() => addLesson(mod.id)}
                                        >
                                            <Plus className="h-3 w-3 mr-1" />
                                            Add Lesson
                                        </Button>
                                    </CardContent>
                                )}
                            </Card>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}
