"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import {
    adminGetUser, adminSetRole, adminBanUser, adminAwardAchievement,
    AdminUserDetail, getAchievementTypes, AchievementType,
} from "@/lib/admin";
import { ArrowLeft, ShieldCheck, ShieldMinus, BadgeCheck } from "lucide-react";
import Link from "next/link";

function fmtDate(d?: string) {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function AdminUserDetailPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const [data, setData] = useState<AdminUserDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [toast, setToast] = useState("");
    const [acting, setActing] = useState(false);
    const [confirmBan, setConfirmBan] = useState(false);
    const [showAward, setShowAward] = useState(false);
    const [awardKey, setAwardKey] = useState("");
    const [types, setTypes] = useState<AchievementType[]>([]);

    function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(""), 2500); }

    useEffect(() => {
        Promise.all([adminGetUser(id), getAchievementTypes()])
            .then(([r, t]) => {
                setData(r.data);
                setTypes(t.data ?? []);
                if (t.data?.[0]) setAwardKey(t.data[0].key);
            })
            .catch(() => setError("Failed to load user."))
            .finally(() => setLoading(false));
    }, [id]);

    async function handleRole(newRole: "user" | "admin") {
        if (!data) return;
        setActing(true);
        try {
            await adminSetRole(id, newRole);
            showToast(`Role updated to ${newRole}`);
            const r = await adminGetUser(id);
            setData(r.data);
        } catch { showToast("Failed."); }
        finally { setActing(false); }
    }

    async function handleBan() {
        if (!data) return;
        setActing(true);
        setConfirmBan(false);
        try {
            await adminBanUser(id, !data.user.isBanned);
            showToast(data.user.isBanned ? "User unbanned" : "User banned");
            const r = await adminGetUser(id);
            setData(r.data);
        } catch { showToast("Failed."); }
        finally { setActing(false); }
    }

    async function handleAward() {
        if (!awardKey) return;
        setActing(true);
        setShowAward(false);
        try {
            await adminAwardAchievement(id, awardKey);
            showToast("Achievement awarded!");
            const r = await adminGetUser(id);
            setData(r.data);
        } catch (e: unknown) {
            showToast(e instanceof Error ? e.message : "Failed to award.");
        }
        finally { setActing(false); }
    }

    if (loading) return <div style={{ textAlign: "center", padding: 60, color: "var(--admin-muted)" }}><div className="aspinner" style={{ margin: "0 auto 12px" }} />Loading…</div>;
    if (error) return <div className="aalert aalert-error">{error}</div>;
    if (!data) return null;

    const { user, enrollments, achievements } = data;

    return (
        <div>
            <div style={{ marginBottom: 20 }}>
                <Link href="/osadmin/admin/users" className="abtn abtn-outline abtn-sm">
                    <ArrowLeft size={13} /> Back to Users
                </Link>
            </div>

            {toast && <div className="aalert aalert-success" style={{ marginBottom: 16 }}>{toast}</div>}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 20, alignItems: "start" }}>
                {/* Profile Card */}
                <div className="acard" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, paddingBottom: 14, borderBottom: "1px solid var(--admin-border)" }}>
                        {user.avatar ? (
                            <Image src={user.avatar} alt="" width={72} height={72} style={{ borderRadius: "50%", objectFit: "cover" }} />
                        ) : (
                            <div style={{ width: 72, height: 72, borderRadius: "50%", background: "rgba(99,102,241,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 700, color: "var(--admin-accent)" }}>
                                {(user.username || user.name || "?")[0].toUpperCase()}
                            </div>
                        )}
                        <div style={{ textAlign: "center" }}>
                            <div style={{ fontWeight: 700, fontSize: 16 }}>{user.name || user.username || "Anonymous"}</div>
                            <div style={{ fontSize: 12, color: "var(--admin-muted)", marginTop: 2 }}>{user.email}</div>
                            <div style={{ marginTop: 6, display: "flex", gap: 6, justifyContent: "center", flexWrap: "wrap" }}>
                                <span className={`abadge ${user.role === "admin" ? "abadge-purple" : "abadge-gray"}`}>{user.role}</span>
                                {user.isBanned && <span className="abadge abadge-red">banned</span>}
                            </div>
                        </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                        {[
                            ["Level", user.level],
                            ["XP", user.totalXP?.toLocaleString()],
                            ["Streak", `${user.currentStreak}d`],
                            ["Longest", `${user.longestStreak ?? 0}d`],
                            ["Joined", fmtDate(user.createdAt)],
                            ["Last Active", fmtDate(user.lastActive)],
                        ].map(([k, v]) => (
                            <div key={String(k)} style={{ background: "var(--admin-surface2)", borderRadius: 8, padding: "8px 10px" }}>
                                <div style={{ fontSize: 10, color: "var(--admin-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{k}</div>
                                <div style={{ fontSize: 14, fontWeight: 700, marginTop: 2 }}>{v ?? "—"}</div>
                            </div>
                        ))}
                    </div>

                    {/* Actions */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, borderTop: "1px solid var(--admin-border)", paddingTop: 14 }}>
                        <div style={{ fontSize: 11, color: "var(--admin-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4 }}>Admin Actions</div>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            <button
                                className="abtn abtn-outline abtn-sm"
                                disabled={acting}
                                onClick={() => handleRole(user.role === "admin" ? "user" : "admin")}
                            >
                                <ShieldCheck size={13} /> {user.role === "admin" ? "Demote to User" : "Promote to Admin"}
                            </button>
                            <button
                                className={`abtn abtn-sm ${user.isBanned ? "abtn-success" : "abtn-danger"}`}
                                disabled={acting}
                                onClick={() => setConfirmBan(true)}
                            >
                                <ShieldMinus size={13} /> {user.isBanned ? "Unban" : "Ban User"}
                            </button>
                            <button className="abtn abtn-outline abtn-sm" onClick={() => setShowAward(true)}>
                                <BadgeCheck size={13} /> Award Achievement
                            </button>
                        </div>
                    </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {/* Enrollments */}
                    <div className="acard">
                        <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>Enrollments ({enrollments.length})</h2>
                        {enrollments.length === 0 ? (
                            <p style={{ color: "var(--admin-muted)", fontSize: 13 }}>No enrollments yet.</p>
                        ) : (
                            <div className="atable-wrap">
                                <table className="atable">
                                    <thead><tr><th>Course</th><th>Difficulty</th><th>Enrolled</th><th>Completed</th></tr></thead>
                                    <tbody>
                                        {enrollments.map((e) => (
                                            <tr key={e._id}>
                                                <td style={{ fontWeight: 500 }}>{typeof e.courseId === "object" ? e.courseId.title : "—"}</td>
                                                <td><span className="abadge abadge-blue">{typeof e.courseId === "object" ? e.courseId.difficulty : "—"}</span></td>
                                                <td style={{ fontSize: 12, color: "var(--admin-muted)" }}>{fmtDate(e.createdAt)}</td>
                                                <td>
                                                    {e.completedAt
                                                        ? <span className="abadge abadge-green">{fmtDate(e.completedAt)}</span>
                                                        : <span className="abadge abadge-yellow">In Progress</span>}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Achievements */}
                    <div className="acard">
                        <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>Achievements ({achievements.length})</h2>
                        {achievements.length === 0 ? (
                            <p style={{ color: "var(--admin-muted)", fontSize: 13 }}>No achievements yet.</p>
                        ) : (
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                                {achievements.map((a) => (
                                    <div key={a._id} style={{ background: "var(--admin-surface2)", borderRadius: 8, padding: "8px 12px", display: "flex", flexDirection: "column", gap: 2 }}>
                                        <span style={{ fontSize: 13, fontWeight: 600 }}>{a.achievementKey}</span>
                                        <span style={{ fontSize: 11, color: "var(--admin-muted)" }}>{fmtDate(a.awardedAt)}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Confirm Ban Modal */}
            {confirmBan && (
                <div className="amodal-backdrop">
                    <div className="amodal">
                        <div className="amodal-title">{user.isBanned ? "Unban" : "Ban"} {user.name || user.username}?</div>
                        <p style={{ fontSize: 13, color: "var(--admin-muted)" }}>
                            {user.isBanned ? "This will restore the user's access to the platform." : "This will block the user from logging in."}
                        </p>
                        <div className="amodal-actions">
                            <button className="abtn abtn-outline" onClick={() => setConfirmBan(false)}>Cancel</button>
                            <button className={`abtn ${user.isBanned ? "abtn-success" : "abtn-danger"}`} onClick={handleBan}>
                                Confirm {user.isBanned ? "Unban" : "Ban"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Award Modal */}
            {showAward && (
                <div className="amodal-backdrop">
                    <div className="amodal">
                        <div className="amodal-title">Award Achievement</div>
                        <div className="aform-group">
                            <label className="aform-label">Achievement</label>
                            <select className="aselect" style={{ width: "100%" }} value={awardKey} onChange={(e) => setAwardKey(e.target.value)}>
                                {types.map((t) => <option key={t.key} value={t.key}>{t.name} ({t.key})</option>)}
                            </select>
                        </div>
                        <div className="amodal-actions">
                            <button className="abtn abtn-outline" onClick={() => setShowAward(false)}>Cancel</button>
                            <button className="abtn abtn-primary" onClick={handleAward}>Award</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
