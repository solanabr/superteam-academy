"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    AreaChart,
    Area,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
} from "recharts";
import {
    Users,
    BookOpen,
    Zap,
    Trophy,
    TrendingUp,
    Settings,
    LayoutDashboard,
    GraduationCap,
    BarChart3,
    Plus,
    Search,
    Edit,
    Trash2,
    Eye,
    ArrowUpRight,
    Activity,
    Calendar,
} from "lucide-react";

/* ── Mock Data ── */
const ENROLLMENT_DATA = [
    { month: "Sep", enrollments: 120, completions: 45 },
    { month: "Oct", enrollments: 189, completions: 67 },
    { month: "Nov", enrollments: 245, completions: 102 },
    { month: "Dec", enrollments: 312, completions: 145 },
    { month: "Jan", enrollments: 378, completions: 198 },
    { month: "Feb", enrollments: 456, completions: 234 },
    { month: "Mar", enrollments: 523, completions: 287 },
];

const DAILY_ACTIVE = [
    { day: "Mon", users: 234 },
    { day: "Tue", users: 312 },
    { day: "Wed", users: 289 },
    { day: "Thu", users: 345 },
    { day: "Fri", users: 267 },
    { day: "Sat", users: 178 },
    { day: "Sun", users: 156 },
];

const TRACK_DISTRIBUTION = [
    { name: "Solana Core", value: 42, color: "#00ff94" },
    { name: "DeFi", value: 28, color: "#00d4ff" },
    { name: "NFTs & Gaming", value: 18, color: "#ff6b6b" },
    { name: "Anchor", value: 12, color: "#ffd93d" },
];

const XP_DISTRIBUTION_DATA = [
    { range: "0-500", students: 456 },
    { range: "500-1K", students: 312 },
    { range: "1K-2K", students: 198 },
    { range: "2K-5K", students: 89 },
    { range: "5K-10K", students: 34 },
    { range: "10K+", students: 12 },
];

const COURSES_TABLE = [
    { id: 1, title: "Solana 101: Building Your First dApp", track: "Solana Core", enrolled: 523, completed: 287, rating: 4.8, status: "published" },
    { id: 2, title: "DeFi Deep Dive: AMMs & Lending", track: "DeFi", enrolled: 312, completed: 145, rating: 4.6, status: "published" },
    { id: 3, title: "NFT Mastery with Metaplex Core", track: "NFTs & Gaming", enrolled: 189, completed: 67, rating: 4.9, status: "published" },
    { id: 4, title: "Anchor Framework Advanced Patterns", track: "Anchor", enrolled: 156, completed: 45, rating: 4.7, status: "draft" },
    { id: 5, title: "Token-2022: Extensions Deep Dive", track: "Solana Core", enrolled: 98, completed: 23, rating: 4.5, status: "published" },
    { id: 6, title: "Cross-Program Invocations Masterclass", track: "Anchor", enrolled: 67, completed: 12, rating: 4.4, status: "review" },
];

const RECENT_ACTIVITY = [
    { user: "sol_builder", action: "Completed Lesson 5 in Solana 101", time: "2m ago", xp: 150 },
    { user: "defi_queen", action: "Enrolled in DeFi Deep Dive", time: "5m ago", xp: 50 },
    { user: "nft_wizard", action: "Earned NFT Mastery credential", time: "12m ago", xp: 500 },
    { user: "rust_learner", action: "Started Anchor Advanced Patterns", time: "18m ago", xp: 25 },
    { user: "web3_dev", action: "Completed Daily Challenge #42", time: "23m ago", xp: 200 },
    { user: "graduate_2026", action: "Reached Level 15", time: "31m ago", xp: 0 },
];

type AdminTab = "overview" | "courses" | "users" | "analytics";

const SIDEBAR_ITEMS: { key: AdminTab; label: string; icon: React.ElementType }[] = [
    { key: "overview", label: "Overview", icon: LayoutDashboard },
    { key: "courses", label: "Courses", icon: BookOpen },
    { key: "users", label: "Users", icon: Users },
    { key: "analytics", label: "Analytics", icon: BarChart3 },
];

export default function AdminPage() {
    const [activeTab, setActiveTab] = useState<AdminTab>("overview");
    const [courseSearch, setCourseSearch] = useState("");

    return (
        <div className="min-h-screen bg-background noise-bg">
            <div className="flex">
                {/* Sidebar */}
                <aside className="hidden lg:flex flex-col w-64 min-h-screen border-r border-border bg-black/40 backdrop-blur-sm p-4 gap-2 sticky top-0">
                    <div className="flex items-center gap-2 px-3 py-4 mb-4 border-b border-border">
                        <Settings className="h-5 w-5 text-primary" />
                        <span className="font-display font-bold text-lg uppercase tracking-wider">Admin</span>
                    </div>
                    {SIDEBAR_ITEMS.map(({ key, label, icon: Icon }) => (
                        <button
                            key={key}
                            onClick={() => setActiveTab(key)}
                            className={`flex items-center gap-3 px-3 py-2.5 text-sm font-mono uppercase tracking-wider transition-all text-left w-full
              ${activeTab === key
                                    ? "bg-primary/20 text-primary border-l-2 border-primary"
                                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/30 border-l-2 border-transparent"
                                }`}
                        >
                            <Icon className="h-4 w-4" />
                            {label}
                        </button>
                    ))}
                </aside>

                {/* Mobile Tabs */}
                <div className="lg:hidden fixed bottom-0 left-0 right-0 border-t border-border bg-black/90 backdrop-blur-sm z-50 flex">
                    {SIDEBAR_ITEMS.map(({ key, label, icon: Icon }) => (
                        <button
                            key={key}
                            onClick={() => setActiveTab(key)}
                            className={`flex-1 flex flex-col items-center gap-1 py-3 text-[10px] font-mono uppercase tracking-wider transition-all
              ${activeTab === key ? "text-primary" : "text-muted-foreground"}`}
                        >
                            <Icon className="h-4 w-4" />
                            {label}
                        </button>
                    ))}
                </div>

                {/* Main Content */}
                <main className="flex-1 p-6 lg:p-8 pb-24 lg:pb-8">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl md:text-4xl font-display font-extrabold uppercase tracking-tighter text-foreground">
                            {SIDEBAR_ITEMS.find((i) => i.key === activeTab)?.label}
                        </h1>
                        <p className="font-mono text-xs text-muted-foreground mt-1">
                            {"// "}Superteam Academy Administration Panel
                        </p>
                    </div>

                    {/* ── OVERVIEW TAB ── */}
                    {activeTab === "overview" && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                            {/* KPI Cards */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                {[
                                    { label: "Total Students", value: "3,456", change: "+12.5%", icon: Users, color: "text-primary" },
                                    { label: "Active Courses", value: "24", change: "+3", icon: BookOpen, color: "text-blue-400" },
                                    { label: "XP Distributed", value: "1.2M", change: "+8.3%", icon: Zap, color: "text-yellow-400" },
                                    { label: "Credentials Issued", value: "892", change: "+15.2%", icon: Trophy, color: "text-purple-400" },
                                ].map((kpi) => (
                                    <Card key={kpi.label} className="border-border bg-card/5 rounded-none">
                                        <CardContent className="p-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
                                                <span className="text-[10px] font-mono text-green-400 flex items-center gap-0.5">
                                                    <ArrowUpRight className="h-3 w-3" />
                                                    {kpi.change}
                                                </span>
                                            </div>
                                            <p className="text-2xl font-display font-bold text-foreground">{kpi.value}</p>
                                            <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground mt-1">
                                                {kpi.label}
                                            </p>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>

                            {/* Charts Row */}
                            <div className="grid lg:grid-cols-2 gap-4">
                                {/* Enrollment Trend */}
                                <Card className="border-border bg-card/5 rounded-none">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="font-mono text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                            <TrendingUp className="h-4 w-4 text-primary" />
                                            Enrollment & Completion Trend
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <ResponsiveContainer width="100%" height={200}>
                                            <AreaChart data={ENROLLMENT_DATA}>
                                                <defs>
                                                    <linearGradient id="enrollGrad" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#00ff94" stopOpacity={0.3} />
                                                        <stop offset="95%" stopColor="#00ff94" stopOpacity={0} />
                                                    </linearGradient>
                                                    <linearGradient id="completeGrad" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.3} />
                                                        <stop offset="95%" stopColor="#00d4ff" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#1a1a2e" />
                                                <XAxis dataKey="month" tick={{ fill: "#666", fontSize: 10 }} />
                                                <YAxis tick={{ fill: "#666", fontSize: 10 }} />
                                                <Tooltip contentStyle={{ backgroundColor: "#0a0a1a", border: "1px solid #1a1a2e", borderRadius: 0, fontFamily: "monospace", fontSize: 11 }} />
                                                <Area type="monotone" dataKey="enrollments" stroke="#00ff94" fill="url(#enrollGrad)" strokeWidth={2} />
                                                <Area type="monotone" dataKey="completions" stroke="#00d4ff" fill="url(#completeGrad)" strokeWidth={2} />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </CardContent>
                                </Card>

                                {/* Daily Active Users */}
                                <Card className="border-border bg-card/5 rounded-none">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="font-mono text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                            <Activity className="h-4 w-4 text-blue-400" />
                                            Daily Active Users
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <ResponsiveContainer width="100%" height={200}>
                                            <BarChart data={DAILY_ACTIVE}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#1a1a2e" />
                                                <XAxis dataKey="day" tick={{ fill: "#666", fontSize: 10 }} />
                                                <YAxis tick={{ fill: "#666", fontSize: 10 }} />
                                                <Tooltip contentStyle={{ backgroundColor: "#0a0a1a", border: "1px solid #1a1a2e", borderRadius: 0, fontFamily: "monospace", fontSize: 11 }} />
                                                <Bar dataKey="users" fill="#00d4ff" radius={[2, 2, 0, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Bottom Row */}
                            <div className="grid lg:grid-cols-3 gap-4">
                                {/* Track Distribution */}
                                <Card className="border-border bg-card/5 rounded-none">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                                            Track Distribution
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <ResponsiveContainer width="100%" height={180}>
                                            <PieChart>
                                                <Pie
                                                    data={TRACK_DISTRIBUTION}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={50}
                                                    outerRadius={70}
                                                    paddingAngle={2}
                                                    dataKey="value"
                                                >
                                                    {TRACK_DISTRIBUTION.map((entry, i) => (
                                                        <Cell key={i} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                                <Tooltip contentStyle={{ backgroundColor: "#0a0a1a", border: "1px solid #1a1a2e", borderRadius: 0, fontFamily: "monospace", fontSize: 11 }} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                        <div className="flex flex-wrap gap-3 mt-2 justify-center">
                                            {TRACK_DISTRIBUTION.map((t) => (
                                                <span key={t.name} className="flex items-center gap-1 text-[10px] font-mono">
                                                    <span className="w-2 h-2" style={{ backgroundColor: t.color }} />
                                                    {t.name} ({t.value}%)
                                                </span>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Recent Activity */}
                                <Card className="border-border bg-card/5 rounded-none lg:col-span-2">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="font-mono text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                            <Calendar className="h-4 w-4 text-primary" />
                                            Recent Activity
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3">
                                            {RECENT_ACTIVITY.map((activity, i) => (
                                                <div key={i} className="flex items-center justify-between border-b border-border/30 pb-2 last:border-0">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded bg-secondary flex items-center justify-center text-xs font-mono font-bold text-foreground">
                                                            {activity.user.slice(0, 2).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-space text-foreground">{activity.action}</p>
                                                            <p className="text-[10px] font-mono text-muted-foreground">{activity.user} · {activity.time}</p>
                                                        </div>
                                                    </div>
                                                    {activity.xp > 0 && (
                                                        <Badge variant="outline" className="rounded-none border-primary/30 text-primary text-[10px] font-mono">
                                                            +{activity.xp} XP
                                                        </Badge>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </motion.div>
                    )}

                    {/* ── COURSES TAB ── */}
                    {activeTab === "courses" && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                            <div className="flex flex-col sm:flex-row gap-4">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search courses..."
                                        value={courseSearch}
                                        onChange={(e) => setCourseSearch(e.target.value)}
                                        className="pl-10 rounded-none border-border bg-black/40 font-mono text-sm"
                                    />
                                </div>
                                <Link href="/admin/create">
                                    <Button className="rounded-none bg-primary text-black font-bold uppercase tracking-widest text-xs">
                                        <Plus className="h-4 w-4 mr-1" />
                                        New Course
                                    </Button>
                                </Link>
                            </div>

                            <Card className="border-border bg-card/5 rounded-none overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-border bg-black/30">
                                                {["Course", "Track", "Enrolled", "Completed", "Rating", "Status", "Actions"].map((h) => (
                                                    <th key={h} className="px-4 py-3 text-left text-[10px] font-mono uppercase tracking-[0.15em] text-muted-foreground">{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {COURSES_TABLE.filter((c) =>
                                                courseSearch === "" || c.title.toLowerCase().includes(courseSearch.toLowerCase())
                                            ).map((course) => (
                                                <tr key={course.id} className="border-b border-border/30 hover:bg-secondary/10 transition-colors">
                                                    <td className="px-4 py-3">
                                                        <span className="font-space text-sm text-foreground">{course.title}</span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className="text-xs font-mono text-muted-foreground">{course.track}</span>
                                                    </td>
                                                    <td className="px-4 py-3 text-sm font-mono text-foreground">{course.enrolled.toLocaleString("en-US")}</td>
                                                    <td className="px-4 py-3 text-sm font-mono text-foreground">{course.completed.toLocaleString("en-US")}</td>
                                                    <td className="px-4 py-3">
                                                        <span className="text-sm font-mono text-yellow-400">★ {course.rating}</span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <Badge
                                                            variant="outline"
                                                            className={`rounded-none text-[10px] font-mono uppercase
                                ${course.status === "published" ? "border-green-500/50 text-green-400" : ""}
                                ${course.status === "draft" ? "border-yellow-500/50 text-yellow-400" : ""}
                                ${course.status === "review" ? "border-blue-500/50 text-blue-400" : ""}
                              `}
                                                        >
                                                            {course.status}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-2">
                                                            <button className="p-1 text-muted-foreground hover:text-foreground transition-colors">
                                                                <Eye className="h-4 w-4" />
                                                            </button>
                                                            <button className="p-1 text-muted-foreground hover:text-primary transition-colors">
                                                                <Edit className="h-4 w-4" />
                                                            </button>
                                                            <button className="p-1 text-muted-foreground hover:text-destructive transition-colors">
                                                                <Trash2 className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </Card>
                        </motion.div>
                    )}

                    {/* ── USERS TAB ── */}
                    {activeTab === "users" && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                {[
                                    { label: "Total Users", value: "3,456", sub: "All time" },
                                    { label: "Active Today", value: "345", sub: "Last 24h" },
                                    { label: "New This Week", value: "89", sub: "Last 7d" },
                                    { label: "Retention Rate", value: "72%", sub: "30-day" },
                                ].map((s) => (
                                    <Card key={s.label} className="border-border bg-card/5 rounded-none">
                                        <CardContent className="p-4">
                                            <p className="text-2xl font-display font-bold text-foreground">{s.value}</p>
                                            <p className="text-[10px] font-mono uppercase tracking-[0.15em] text-muted-foreground mt-1">{s.label}</p>
                                            <p className="text-[9px] font-mono text-muted-foreground/50 mt-0.5">{s.sub}</p>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>

                            {/* XP Distribution */}
                            <Card className="border-border bg-card/5 rounded-none">
                                <CardHeader className="pb-2">
                                    <CardTitle className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                                        Student XP Distribution
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ResponsiveContainer width="100%" height={250}>
                                        <BarChart data={XP_DISTRIBUTION_DATA}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#1a1a2e" />
                                            <XAxis dataKey="range" tick={{ fill: "#666", fontSize: 10 }} />
                                            <YAxis tick={{ fill: "#666", fontSize: 10 }} />
                                            <Tooltip contentStyle={{ backgroundColor: "#0a0a1a", border: "1px solid #1a1a2e", borderRadius: 0, fontFamily: "monospace", fontSize: 11 }} />
                                            <Bar dataKey="students" fill="#00ff94" radius={[2, 2, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}

                    {/* ── ANALYTICS TAB ── */}
                    {activeTab === "analytics" && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                            <div className="grid lg:grid-cols-2 gap-4">
                                <Card className="border-border bg-card/5 rounded-none">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                                            Enrollment Growth
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <ResponsiveContainer width="100%" height={300}>
                                            <AreaChart data={ENROLLMENT_DATA}>
                                                <defs>
                                                    <linearGradient id="enrollGrad2" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#00ff94" stopOpacity={0.4} />
                                                        <stop offset="95%" stopColor="#00ff94" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#1a1a2e" />
                                                <XAxis dataKey="month" tick={{ fill: "#666", fontSize: 10 }} />
                                                <YAxis tick={{ fill: "#666", fontSize: 10 }} />
                                                <Tooltip contentStyle={{ backgroundColor: "#0a0a1a", border: "1px solid #1a1a2e", borderRadius: 0, fontFamily: "monospace", fontSize: 11 }} />
                                                <Area type="monotone" dataKey="enrollments" stroke="#00ff94" fill="url(#enrollGrad2)" strokeWidth={2} />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </CardContent>
                                </Card>

                                <Card className="border-border bg-card/5 rounded-none">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                                            Completion Rates by Track
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4 mt-4">
                                            {[
                                                { track: "Solana Core", rate: 55, color: "#00ff94" },
                                                { track: "DeFi", rate: 47, color: "#00d4ff" },
                                                { track: "NFTs & Gaming", rate: 35, color: "#ff6b6b" },
                                                { track: "Anchor", rate: 29, color: "#ffd93d" },
                                            ].map((item) => (
                                                <div key={item.track}>
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="text-sm font-space text-foreground">{item.track}</span>
                                                        <span className="text-xs font-mono text-muted-foreground">{item.rate}%</span>
                                                    </div>
                                                    <div className="h-2 w-full bg-secondary/30 overflow-hidden">
                                                        <motion.div
                                                            className="h-full"
                                                            style={{ backgroundColor: item.color }}
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${item.rate}%` }}
                                                            transition={{ duration: 1, delay: 0.2 }}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Key Metrics */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                {[
                                    { label: "Avg Session", value: "14m 32s" },
                                    { label: "Lessons/Day", value: "2.3" },
                                    { label: "Challenge Win Rate", value: "68%" },
                                    { label: "Forum Posts/Week", value: "127" },
                                ].map((m) => (
                                    <Card key={m.label} className="border-border bg-card/5 rounded-none">
                                        <CardContent className="p-4 text-center">
                                            <p className="text-xl font-display font-bold text-foreground">{m.value}</p>
                                            <p className="text-[10px] font-mono uppercase tracking-[0.15em] text-muted-foreground mt-1">{m.label}</p>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </main>
            </div>
        </div>
    );
}
