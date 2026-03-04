"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { analyticsOverview, AnalyticsOverview, adminSyncSanity } from "@/lib/admin";
import {
    Users,
    BookOpen,
    TrendingUp,
    MessageSquare,
    Star,
    Activity,
    CheckCircle2,
    Zap,
    RefreshCw,
} from "lucide-react";

interface StatCardProps {
    label: string;
    value: string | number;
    sub?: string;
    icon: React.ReactNode;
    color: string;
}

function StatCard({ label, value, sub, icon, color }: StatCardProps) {
    return (
        <div className="astat">
            <div className="astat-icon" style={{ background: color }}>{icon}</div>
            <div className="astat-label">{label}</div>
            <div className="astat-value">{Number(value).toLocaleString()}</div>
            {sub && <div className="astat-sub">{sub}</div>}
        </div>
    );
}

export default function AdminDashboard() {
    const [data, setData] = useState<AnalyticsOverview | null>(null);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
    const [error, setError] = useState("");

    useEffect(() => {
        analyticsOverview()
            .then((r) => setData(r.data))
            .catch(() => setError("Failed to load analytics. Is the backend running?"))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return (
        <div style={{ textAlign: "center", padding: "60px 0", color: "var(--admin-muted)" }}>
            <div className="aspinner" style={{ width: 28, height: 28, margin: "0 auto 12px" }} />
            Loading platform metrics…
        </div>
    );

    if (error) return <div className="aalert aalert-error">{error}</div>;

    const completionRate = data
        ? data.enrollments.total > 0
            ? Math.round((data.enrollments.completed / data.enrollments.total) * 100)
            : 0
        : 0;

    const handleSync = async () => {
        setSyncing(true);
        setToast(null);
        try {
            const res = await adminSyncSanity();
            const total = res.created.length + res.updated.length;
            setToast({
                type: "success",
                message: `Sync complete! ${total} courses updated (${res.errors.length} errors).`,
            });
        } catch (err: any) {
            setToast({
                type: "error",
                message: err.message || "Failed to sync with Sanity.",
            });
        } finally {
            setSyncing(false);
            setTimeout(() => setToast(null), 5000);
        }
    };

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Platform Overview</h1>
                <p className="page-sub">Real-time health metrics for the Osmos platform</p>
            </div>

            {toast && (
                <div className={`aalert ${toast.type === "success" ? "aalert-success" : "aalert-error"}`} style={{ marginBottom: 20 }}>
                    {toast.message}
                </div>
            )}

            {/* Users */}
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--admin-muted)", marginBottom: 10 }}>
                Users
            </p>
            <div className="grid-stats" style={{ marginBottom: 28 }}>
                <StatCard
                    label="Total Users"
                    value={data?.users.total ?? 0}
                    sub="All registered accounts"
                    icon={<Users size={18} color="#fff" />}
                    color="rgba(99,102,241,0.2)"
                />
                <StatCard
                    label="Active Today"
                    value={data?.users.activeToday ?? 0}
                    sub="Logged in last 24h"
                    icon={<Activity size={18} color="#fff" />}
                    color="rgba(34,197,94,0.15)"
                />
                <StatCard
                    label="Active This Week"
                    value={data?.users.activeThisWeek ?? 0}
                    sub="Logged in last 7 days"
                    icon={<TrendingUp size={18} color="#fff" />}
                    color="rgba(139,92,246,0.2)"
                />
            </div>

            {/* Learning */}
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--admin-muted)", marginBottom: 10 }}>
                Learning
            </p>
            <div className="grid-stats" style={{ marginBottom: 28 }}>
                <StatCard
                    label="Total Enrollments"
                    value={data?.enrollments.total ?? 0}
                    sub="All course enrollments"
                    icon={<BookOpen size={18} color="#fff" />}
                    color="rgba(245,158,11,0.15)"
                />
                <StatCard
                    label="Completions"
                    value={data?.enrollments.completed ?? 0}
                    sub={`${completionRate}% completion rate`}
                    icon={<CheckCircle2 size={18} color="#fff" />}
                    color="rgba(34,197,94,0.15)"
                />
                <StatCard
                    label="XP Distributed"
                    value={data?.xpDistributed ?? 0}
                    sub="Total XP across all users"
                    icon={<Zap size={18} color="#fff" />}
                    color="rgba(251,191,36,0.15)"
                />
            </div>

            {/* Community */}
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--admin-muted)", marginBottom: 10 }}>
                Community
            </p>
            <div className="grid-stats" style={{ marginBottom: 32 }}>
                <StatCard
                    label="Total Threads"
                    value={data?.community.threads ?? 0}
                    sub="Active forum threads"
                    icon={<MessageSquare size={18} color="#fff" />}
                    color="rgba(59,130,246,0.15)"
                />
                <StatCard
                    label="Total Replies"
                    value={data?.community.replies ?? 0}
                    sub="Community responses"
                    icon={<Star size={18} color="#fff" />}
                    color="rgba(236,72,153,0.15)"
                />
            </div>

            {/* Quick Links */}
            <div className="page-header">
                <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--admin-text)", marginBottom: 14 }}>Quick Actions</h2>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
                {[
                    { href: "/osadmin/admin/users", label: "Manage Users", icon: <Users size={16} /> },
                    { href: "/osadmin/admin/courses", label: "Manage Courses", icon: <BookOpen size={16} /> },
                    { href: "/osadmin/admin/analytics", label: "View Analytics", icon: <TrendingUp size={16} /> },
                    { href: "/osadmin/admin/community", label: "Moderate Community", icon: <MessageSquare size={16} /> },
                    { href: "/osadmin/admin/achievements", label: "Achievements", icon: <Star size={16} /> },
                    { href: "/osadmin/admin/courses/new", label: "+ New Course", icon: <BookOpen size={16} /> },
                ].map(({ href, label, icon }) => (
                    <Link key={href} href={href} className="abtn abtn-outline" style={{ justifyContent: "flex-start" }}>
                        {icon} {label}
                    </Link>
                ))}
                <button
                    className="abtn abtn-primary"
                    style={{ justifyContent: "flex-start" }}
                    onClick={handleSync}
                    disabled={syncing}
                >
                    {syncing ? <span className="aspinner" style={{ width: 14, height: 14 }} /> : <RefreshCw size={16} />}
                    {syncing ? "Syncing..." : "Sync with Sanity"}
                </button>
            </div>
        </div>
    );
}
