"use client";

import { useEffect, useState } from "react";
import {
    analyticsUsers, analyticsCourses, analyticsAchievements,
    AnalyticsUsers, AnalyticsCourse, AchievementStat,
} from "@/lib/admin";
import {
    LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer,
} from "recharts";

const SECTION_H2 = { fontSize: 15, fontWeight: 700, color: "var(--admin-text)", marginBottom: 16 } as const;

const chartTheme = {
    stroke: "#6366f1",
    fill: "rgba(99,102,241,0.15)",
    grid: "rgba(255,255,255,0.05)",
    text: "#94a3b8",
};

export default function AdminAnalyticsPage() {
    const [userData, setUserData] = useState<AnalyticsUsers | null>(null);
    const [courseData, setCourseData] = useState<AnalyticsCourse[]>([]);
    const [achData, setAchData] = useState<AchievementStat[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        Promise.all([analyticsUsers(), analyticsCourses(), analyticsAchievements()])
            .then(([u, c, a]) => {
                setUserData(u.data);
                setCourseData(c.data);
                setAchData(a.data);
            })
            .catch(() => setError("Failed to load analytics."))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return (
        <div style={{ textAlign: "center", padding: "60px 0", color: "var(--admin-muted)" }}>
            <div className="aspinner" style={{ width: 28, height: 28, margin: "0 auto 12px" }} />Loading analytics…
        </div>
    );
    if (error) return <div className="aalert aalert-error">{error}</div>;

    const signups = userData?.signupsByDay ?? [];
    const levelDist = userData?.levelDistribution ?? [];

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
            <div className="page-header">
                <h1 className="page-title">Analytics Hub</h1>
                <p className="page-sub">Platform-wide performance metrics</p>
            </div>

            {/* User Signups Chart */}
            <div className="acard">
                <h2 style={SECTION_H2}>New User Signups — Last 30 Days</h2>
                {signups.length === 0 ? (
                    <div className="aempty"><div className="aempty-icon">📈</div>No signup data yet.</div>
                ) : (
                    <ResponsiveContainer width="100%" height={220}>
                        <LineChart data={signups} margin={{ top: 8, right: 16, bottom: 0, left: -10 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
                            <XAxis dataKey="date" tick={{ fontSize: 11, fill: chartTheme.text }} tickFormatter={(v: string) => v.slice(5)} />
                            <YAxis tick={{ fontSize: 11, fill: chartTheme.text }} />
                            <Tooltip
                                contentStyle={{ background: "var(--admin-surface)", border: "1px solid var(--admin-border)", borderRadius: 8, fontSize: 12 }}
                                labelStyle={{ color: "var(--admin-muted)" }}
                                itemStyle={{ color: chartTheme.stroke }}
                            />
                            <Line type="monotone" dataKey="count" stroke={chartTheme.stroke} strokeWidth={2} dot={false} fill={chartTheme.fill} />
                        </LineChart>
                    </ResponsiveContainer>
                )}
            </div>

            {/* Level Distribution */}
            <div className="acard">
                <h2 style={SECTION_H2}>User Level Distribution</h2>
                {levelDist.length === 0 ? (
                    <div className="aempty"><div className="aempty-icon">📊</div>No user level data yet.</div>
                ) : (
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={levelDist} margin={{ top: 8, right: 16, bottom: 0, left: -10 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
                            <XAxis dataKey="level" tick={{ fontSize: 11, fill: chartTheme.text }} label={{ value: "Level", position: "insideBottom", offset: -2, fill: chartTheme.text, fontSize: 11 }} />
                            <YAxis tick={{ fontSize: 11, fill: chartTheme.text }} />
                            <Tooltip
                                contentStyle={{ background: "var(--admin-surface)", border: "1px solid var(--admin-border)", borderRadius: 8, fontSize: 12 }}
                                labelStyle={{ color: "var(--admin-muted)" }}
                                itemStyle={{ color: "#8b5cf6" }}
                            />
                            <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </div>

            {/* Course Performance Table */}
            <div className="acard">
                <h2 style={SECTION_H2}>Course Performance</h2>
                {courseData.length === 0 ? (
                    <div className="aempty"><div className="aempty-icon">📚</div>No course data yet.</div>
                ) : (
                    <div className="atable-wrap">
                        <table className="atable">
                            <thead>
                                <tr>
                                    <th>Course</th>
                                    <th>Status</th>
                                    <th>Enrollments</th>
                                    <th>Completion Rate</th>
                                    <th>Avg Time (h)</th>
                                    <th>Rating</th>
                                </tr>
                            </thead>
                            <tbody>
                                {courseData.map((c) => (
                                    <tr key={c._id}>
                                        <td>
                                            <div style={{ fontWeight: 600, fontSize: 13 }}>{c.title}</div>
                                            <div style={{ fontSize: 11, color: "var(--admin-muted)" }}>{c.difficulty}</div>
                                        </td>
                                        <td><span className={`abadge ${c.status === "published" ? "abadge-green" : "abadge-gray"}`}>{c.status}</span></td>
                                        <td style={{ fontSize: 13 }}>{c.enrollmentCount.toLocaleString()}</td>
                                        <td>
                                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                <div style={{ flex: 1, height: 6, borderRadius: 3, background: "var(--admin-surface2)", overflow: "hidden" }}>
                                                    <div style={{ width: `${c.completionRate}%`, height: "100%", background: c.completionRate >= 70 ? "#22c55e" : c.completionRate >= 40 ? "#f59e0b" : "#ef4444", borderRadius: 3 }} />
                                                </div>
                                                <span style={{ fontSize: 12, fontWeight: 600, minWidth: 32 }}>{c.completionRate}%</span>
                                            </div>
                                        </td>
                                        <td style={{ fontSize: 13 }}>{c.avgCompletionHours != null ? `${c.avgCompletionHours}h` : "—"}</td>
                                        <td style={{ fontSize: 13 }}>
                                            {c.ratingCount > 0 ? `⭐ ${c.rating.toFixed(1)}` : "—"}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Achievement Stats */}
            <div className="acard">
                <h2 style={SECTION_H2}>Achievement Adoption</h2>
                {achData.length === 0 ? (
                    <div className="aempty"><div className="aempty-icon">🏆</div>No achievement data yet.</div>
                ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
                        {achData.map((a) => (
                            <div key={a.key} className="acard acard-sm" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <span style={{ fontSize: 12, fontWeight: 700 }}>{a.name}</span>
                                    <span className={`abadge ${a.isActive ? "abadge-green" : "abadge-gray"}`}>{a.isActive ? "active" : "inactive"}</span>
                                </div>
                                <span style={{ fontSize: 11, color: "var(--admin-muted)" }}>{a.category}</span>
                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                                    <span style={{ color: "var(--admin-muted)" }}>Minted</span>
                                    <span style={{ fontWeight: 700 }}>{a.mintedCount.toLocaleString()}</span>
                                </div>
                                <div>
                                    <div style={{ height: 5, borderRadius: 3, background: "var(--admin-surface2)", overflow: "hidden" }}>
                                        <div style={{ width: `${a.percentOfUsers}%`, height: "100%", background: "var(--admin-accent)", borderRadius: 3 }} />
                                    </div>
                                    <div style={{ fontSize: 11, color: "var(--admin-muted)", marginTop: 4 }}>{a.percentOfUsers}% of users</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
