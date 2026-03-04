"use client";

import React, { useState } from "react";
import {
    Users, BookOpen, TrendingUp, Zap,
    Settings, Plus, BarChart3, Clock,
    Trash2, Edit3, Save, Play, Code,
    Layout, ChevronRight, Check
} from "lucide-react";
import { MeshGradient } from "@/components/MeshGradient";
import { GridPattern } from "@/components/GridPattern";
import { motion, AnimatePresence } from "framer-motion";

const ANALYTICS_DATA = [
    { label: "Total Students", value: "1,245", trend: "+12%", icon: Users, color: "text-blue-400" },
    { label: "Course Completions", value: "892", trend: "+8%", icon: Check, color: "text-green-400" },
    { label: "XP Distributed", value: "450K", trend: "+24%", icon: Zap, color: "text-yellow-400" },
    { label: "Active Now", value: "156", trend: "Live", icon: Clock, color: "text-purple-400" },
];

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState<"analytics" | "courses">("analytics");
    const [showAddCourse, setShowAddCourse] = useState(false);

    return (
        <div className="min-h-screen bg-black text-white relative flex flex-col pt-14">
            <MeshGradient />
            <GridPattern />

            {/* Admin Header */}
            <header className="relative z-20 border-b border-white/5 bg-black/40 backdrop-blur-md px-8 py-6">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold italic tracking-tight flex items-center gap-2">
                            <Settings className="w-6 h-6 text-white/40" />
                            Admin Control Center
                        </h1>
                        <p className="text-white/40 text-sm">Platform Management & Real-time Analytics</p>
                    </div>
                    <div className="flex gap-4">
                        <button
                            onClick={() => setActiveTab("analytics")}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "analytics" ? "bg-white/10 text-white" : "text-white/40 hover:text-white"}`}
                        >
                            Analytics
                        </button>
                        <button
                            onClick={() => setActiveTab("courses")}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "courses" ? "bg-white/10 text-white" : "text-white/40 hover:text-white"}`}
                        >
                            Management
                        </button>
                    </div>
                </div>
            </header>

            <main className="relative z-10 flex-1 p-8">
                <div className="max-w-7xl mx-auto">
                    {activeTab === "analytics" ? (
                        <AnalyticsView />
                    ) : (
                        <CourseManagementView />
                    )}
                </div>
            </main>
        </div>
    );
}

function AnalyticsView() {
    return (
        <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid md:grid-cols-4 gap-6">
                {ANALYTICS_DATA.map((stat, i) => (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        key={stat.label}
                        className="group bg-white/5 border border-white/10 p-6 rounded-2xl hover:bg-white/[0.08] transition-all"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className={`p-2 rounded-lg bg-white/5 ${stat.color}`}>
                                <stat.icon className="w-5 h-5" />
                            </div>
                            <span className={`text-xs font-medium px-2 py-1 rounded-full ${stat.trend === "Live" ? "bg-red-500/20 text-red-400" : "bg-green-500/20 text-green-400"}`}>
                                {stat.trend}
                            </span>
                        </div>
                        <div className="text-2xl font-bold mb-1 tracking-tight">{stat.value}</div>
                        <div className="text-white/40 text-xs font-medium uppercase tracking-wider">{stat.label}</div>
                    </motion.div>
                ))}
            </div>

            {/* Main Charts Placeholder */}
            <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-2xl p-8 h-[400px] flex items-center justify-center relative overflow-hidden group">
                    <BarChart3 className="w-12 h-12 text-white/10 group-hover:scale-110 transition-transform duration-500" />
                    <div className="absolute top-6 left-6">
                        <h3 className="text-lg font-medium">Growth Metrics</h3>
                        <p className="text-white/40 text-sm">Monthly enrollment vs. Completion rate</p>
                    </div>
                    {/* Mock chart lines */}
                    <div className="absolute inset-0 flex items-end justify-between px-16 pb-12 opacity-20 pointer-events-none">
                        {[40, 70, 45, 90, 65, 80, 50, 95, 75, 60, 85, 40].map((h, i) => (
                            <div key={i} className="w-4 bg-white rounded-t-sm" style={{ height: `${h}%` }} />
                        ))}
                    </div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
                    <h3 className="text-lg font-medium mb-6">Course Performance</h3>
                    <div className="space-y-6">
                        {[
                            { name: "Anchor Fundamentals", progress: 85, color: "bg-purple-500" },
                            { name: "Token-2022 Mastery", progress: 62, color: "bg-blue-500" },
                            { name: "ZK Compression", progress: 41, color: "bg-green-500" },
                            { name: "Security Auditing", progress: 19, color: "bg-red-500" },
                        ].map((course) => (
                            <div key={course.name}>
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-white/80">{course.name}</span>
                                    <span className="text-white/40">{course.progress}% usage</span>
                                </div>
                                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                    <div className={`h-full ${course.color}`} style={{ width: `${course.progress}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function CourseManagementView() {
    const [isCreating, setIsCreating] = useState(false);
    const [courses, setCourses] = useState([
        { id: "anchor-fundamentals", title: "Anchor Fundamentals", status: "Published", lessons: 12, students: 450 },
        { id: "token-2022-mastery", title: "Token-2022 Mastery", status: "Published", lessons: 8, students: 320 },
        { id: "zk-compression", title: "ZK Compression", status: "Draft", lessons: 10, students: 0 },
    ]);

    return (
        <div className="space-y-8">
            <AnimatePresence mode="wait">
                {!isCreating ? (
                    <motion.div
                        key="list"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="space-y-8"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-semibold">Content Library</h2>
                                <p className="text-white/40 text-sm">Manage courses, modules, and on-chain certificates</p>
                            </div>
                            <button
                                onClick={() => setIsCreating(true)}
                                className="flex items-center gap-2 px-5 py-2.5 bg-white text-black rounded-xl font-bold hover:bg-white/90 transition-all text-sm"
                            >
                                <Plus className="w-4 h-4" />
                                Create New Course
                            </button>
                        </div>

                        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-white/5 bg-white/[0.02]">
                                        <th className="px-6 py-4 text-xs font-medium uppercase tracking-wider text-white/40">Course Title</th>
                                        <th className="px-6 py-4 text-xs font-medium uppercase tracking-wider text-white/40">Status</th>
                                        <th className="px-6 py-4 text-xs font-medium uppercase tracking-wider text-white/40">Lessons</th>
                                        <th className="px-6 py-4 text-xs font-medium uppercase tracking-wider text-white/40">Enrollments</th>
                                        <th className="px-6 py-4 text-xs font-medium uppercase tracking-wider text-white/40 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {courses.map((course) => (
                                        <tr key={course.id} className="group hover:bg-white/[0.02] transition-colors">
                                            <td className="px-6 py-5">
                                                <div className="font-medium text-white/90">{course.title}</div>
                                                <div className="text-xs text-white/40 italic">st-academy://{course.id}</div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className={`text-[10px] font-bold uppercase tracking-tight px-2 py-0.5 rounded ${course.status === "Published" ? "bg-green-500/10 text-green-400" : "bg-yellow-500/10 text-yellow-400"}`}>
                                                    {course.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5 text-sm text-white/60">{course.lessons} units</td>
                                            <td className="px-6 py-5 text-sm text-white/60">{course.students.toLocaleString()} students</td>
                                            <td className="px-6 py-5 text-right">
                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/60 hover:text-white">
                                                        <Edit3 className="w-4 h-4" />
                                                    </button>
                                                    <button className="p-2 hover:bg-red-500/10 rounded-lg transition-colors text-white/40 hover:text-red-400">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                ) : (
                    <AdvancedCourseCreator onBack={() => setIsCreating(false)} />
                )}
            </AnimatePresence>
        </div>
    );
}

function AdvancedCourseCreator({ onBack }: { onBack: () => void }) {
    const [lessons, setLessons] = useState([
        {
            id: "1",
            title: "",
            description: "",
            hasVideo: true,
            videoUrl: "",
            hasEditor: false,
            hasCode: true,
            codeSnippet: ""
        }
    ]);

    const addLesson = () => {
        setLessons([...lessons, {
            id: Math.random().toString(36).substr(2, 9),
            title: "",
            description: "",
            hasVideo: false,
            videoUrl: "",
            hasEditor: false,
            hasCode: false,
            codeSnippet: ""
        }]);
    };

    const updateLesson = (id: string, field: string, value: any) => {
        setLessons(lessons.map(l => l.id === id ? { ...l, [field]: value } : l));
    };

    const removeLesson = (id: string) => {
        if (lessons.length > 1) {
            setLessons(lessons.filter(l => l.id !== id));
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
        >
            <div className="flex items-center justify-between">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-white/40 hover:text-white transition-colors"
                >
                    <ChevronRight className="w-4 h-4 rotate-180" />
                    Back to Library
                </button>
                <button className="flex items-center gap-2 px-6 py-2.5 bg-green-500 text-black rounded-xl font-bold hover:bg-green-400 transition-all shadow-lg shadow-green-500/20">
                    <Save className="w-4 h-4" />
                    Publish Course
                </button>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    {/* Global Info */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-8 space-y-6">
                        <h3 className="text-lg font-medium">Course Essentials</h3>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Title</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Advanced Anchor Patterns"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-white/30"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Track</label>
                                <select className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none appearance-none [&>option]:bg-zinc-900 [&>option]:text-white cursor-pointer hover:border-white/20 transition-all">
                                    <option className="bg-zinc-900">Development</option>
                                    <option className="bg-zinc-900">Security</option>
                                    <option className="bg-zinc-900">Infrastructure</option>
                                    <option className="bg-zinc-900">DeFi</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Difficulty</label>
                                <select className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none appearance-none [&>option]:bg-zinc-900 [&>option]:text-white cursor-pointer hover:border-white/20 transition-all">
                                    <option className="bg-zinc-900">Beginner</option>
                                    <option className="bg-zinc-900">Intermediate</option>
                                    <option className="bg-zinc-900">Advanced</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Est. Hours</label>
                                <input
                                    type="number"
                                    placeholder="e.g. 5"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-white/30"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">XP Reward</label>
                                <input
                                    type="number"
                                    placeholder="e.g. 1000"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-white/30"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Description</label>
                            <textarea
                                placeholder="Briefly describe what students will learn..."
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none min-h-[100px]"
                            />
                        </div>
                    </div>

                    {/* Lessons List */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between px-2">
                            <h3 className="text-lg font-medium">Course Syllabus</h3>
                            <span className="text-xs text-white/40">{lessons.length} {lessons.length === 1 ? "Lesson" : "Lessons"} planned</span>
                        </div>

                        {lessons.map((lesson, index) => (
                            <motion.div
                                layout
                                key={lesson.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white/5 border border-white/10 rounded-2xl p-8 space-y-6 group relative overflow-hidden"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-xs font-bold text-white/40">
                                            {index + 1}
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="Lesson Title"
                                            value={lesson.title}
                                            onChange={(e) => updateLesson(lesson.id, "title", e.target.value)}
                                            className="bg-transparent text-xl font-medium focus:outline-none border-b border-white/0 focus:border-white/20 px-1 py-0.5"
                                        />
                                    </div>
                                    <button
                                        onClick={() => removeLesson(lesson.id)}
                                        className="p-2 text-white/20 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Lesson Info / Description</label>
                                    <textarea
                                        placeholder="What will students do in this lesson?"
                                        value={lesson.description}
                                        onChange={(e) => updateLesson(lesson.id, "description", e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-white/30 min-h-[60px]"
                                    />
                                </div>

                                <div className="grid md:grid-cols-3 gap-6 pt-4 border-t border-white/5">
                                    {/* Content Toggles */}
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 block mb-2">Content types</label>

                                        <button
                                            onClick={() => updateLesson(lesson.id, "hasVideo", !lesson.hasVideo)}
                                            className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${lesson.hasVideo ? "bg-blue-500/10 border-blue-500/30 text-blue-400" : "bg-white/5 border-white/5 text-white/40 hover:border-white/20"}`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <Play className="w-4 h-4" />
                                                <span className="text-xs font-medium">Video Required</span>
                                            </div>
                                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${lesson.hasVideo ? "bg-blue-400 border-blue-400" : "border-white/20"}`}>
                                                {lesson.hasVideo && <Check className="w-3 h-3 text-black" />}
                                            </div>
                                        </button>

                                        <button
                                            onClick={() => updateLesson(lesson.id, "hasEditor", !lesson.hasEditor)}
                                            className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${lesson.hasEditor ? "bg-green-500/10 border-green-500/30 text-green-400" : "bg-white/5 border-white/5 text-white/40 hover:border-white/20"}`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <Layout className="w-4 h-4" />
                                                <span className="text-xs font-medium">Playground/Editor</span>
                                            </div>
                                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${lesson.hasEditor ? "bg-green-400 border-green-400" : "border-white/20"}`}>
                                                {lesson.hasEditor && <Check className="w-3 h-3 text-black" />}
                                            </div>
                                        </button>

                                        <button
                                            onClick={() => updateLesson(lesson.id, "hasCode", !lesson.hasCode)}
                                            className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${lesson.hasCode ? "bg-orange-500/10 border-orange-500/30 text-orange-400" : "bg-white/5 border-white/5 text-white/40 hover:border-white/20"}`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <Code className="w-4 h-4" />
                                                <span className="text-xs font-medium">Code Examples</span>
                                            </div>
                                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${lesson.hasCode ? "bg-orange-400 border-orange-400" : "border-white/20"}`}>
                                                {lesson.hasCode && <Check className="w-3 h-3 text-black" />}
                                            </div>
                                        </button>
                                    </div>

                                    {/* Dynamic Inputs */}
                                    <div className="md:col-span-2 space-y-4">
                                        <AnimatePresence>
                                            {lesson.hasVideo && (
                                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="space-y-2 overflow-hidden">
                                                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Video URL</label>
                                                    <input
                                                        type="text"
                                                        placeholder="https://youtube.com/..."
                                                        value={lesson.videoUrl}
                                                        onChange={(e) => updateLesson(lesson.id, "videoUrl", e.target.value)}
                                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-blue-500/40"
                                                    />
                                                </motion.div>
                                            )}

                                            {lesson.hasCode && (
                                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="space-y-2 overflow-hidden">
                                                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Code Snippet (Markdown)</label>
                                                    <textarea
                                                        placeholder="pub fn main() { ... }"
                                                        value={lesson.codeSnippet}
                                                        onChange={(e) => updateLesson(lesson.id, "codeSnippet", e.target.value)}
                                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-orange-500/40 min-h-[120px] font-mono"
                                                    />
                                                </motion.div>
                                            )}

                                            {!lesson.hasVideo && !lesson.hasCode && !lesson.hasEditor && (
                                                <div className="h-full flex flex-col items-center justify-center text-center p-8 border border-dashed border-white/10 rounded-2xl bg-white/[0.01]">
                                                    <Plus className="w-6 h-6 text-white/10 mb-2" />
                                                    <p className="text-xs text-white/20 uppercase tracking-widest">Select content types to begin</p>
                                                </div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>
                            </motion.div>
                        ))}

                        <button
                            onClick={addLesson}
                            className="w-full py-6 border border-dashed border-white/10 rounded-2xl flex items-center justify-center gap-2 text-white/40 hover:bg-white/[0.02] hover:border-white/20 transition-all group"
                        >
                            <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            <span className="text-sm font-medium">Add another lesson</span>
                        </button>
                    </div>
                </div>

                {/* Sidebar Preview */}
                <div className="space-y-6">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 sticky top-24">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-white/40 mb-6">Course Preview</h3>

                        <div className="bg-black/60 border border-white/5 rounded-2xl p-5 space-y-4">
                            <div className="aspect-video bg-white/5 rounded-xl flex items-center justify-center overflow-hidden relative group">
                                {lessons[0].videoUrl ? (
                                    <div className="absolute inset-0 bg-blue-500/10 flex items-center justify-center">
                                        <Play className="w-12 h-12 text-blue-400/40" />
                                    </div>
                                ) : (
                                    <div className="text-white/10 uppercase text-[10px] tracking-widest font-bold">No Media</div>
                                )}
                            </div>

                            <div className="space-y-1">
                                <div className="h-4 w-3/4 bg-white/10 rounded-full" />
                                <div className="h-3 w-1/2 bg-white/5 rounded-full" />
                            </div>

                            <div className="grid grid-cols-3 gap-2 py-4 border-t border-b border-white/5">
                                {[...Array(3)].map((_, i) => (
                                    <div key={i} className="space-y-1">
                                        <div className="h-2 w-full bg-white/5 rounded-full" />
                                        <div className="h-2 w-2/3 bg-white/10 rounded-full" />
                                    </div>
                                ))}
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-[10px] text-white/40 uppercase tracking-widest font-bold">
                                    <span>Progress</span>
                                    <span>0%</span>
                                </div>
                                <div className="h-1.5 w-full bg-white/5 rounded-full" />
                            </div>

                            <div className="w-full py-3 bg-white text-black text-center text-xs font-bold uppercase tracking-widest rounded-xl">
                                Enroll Now
                            </div>
                        </div>

                        <div className="mt-8 space-y-4">
                            <div className="flex items-center justify-between text-xs px-2">
                                <span className="text-white/40">Total XP</span>
                                <span className="text-white">1,200 XP</span>
                            </div>
                            <div className="flex items-center justify-between text-xs px-2">
                                <span className="text-white/40">Est. Duration</span>
                                <span className="text-white">4.5 hours</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
