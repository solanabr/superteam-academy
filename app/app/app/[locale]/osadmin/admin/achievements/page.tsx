"use client";

import { useEffect, useState } from "react";
import {
    getAchievementTypes, analyticsAchievements,
    adminAwardAchievement, AchievementType, AchievementStat,
} from "@/lib/admin";
import { BadgeCheck } from "lucide-react";

const CAT_COLOR: Record<string, string> = {
    course_completion: "abadge-green",
    streak: "abadge-yellow",
    community: "abadge-blue",
    special: "abadge-purple",
};

export default function AdminAchievementsPage() {
    const [types, setTypes] = useState<AchievementType[]>([]);
    const [stats, setStats] = useState<Map<string, AchievementStat>>(new Map());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [toast, setToast] = useState("");
    const [awardModal, setAwardModal] = useState<AchievementType | null>(null);
    const [userId, setUserId] = useState("");
    const [awarding, setAwarding] = useState(false);

    function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(""), 2500); }

    useEffect(() => {
        Promise.all([getAchievementTypes(), analyticsAchievements()])
            .then(([t, s]) => {
                setTypes(t.data ?? []);
                const map = new Map<string, AchievementStat>();
                (s.data ?? []).forEach((x) => map.set(x.key, x));
                setStats(map);
            })
            .catch(() => setError("Failed to load achievements."))
            .finally(() => setLoading(false));
    }, []);

    async function handleAward() {
        if (!awardModal || !userId.trim()) return;
        setAwarding(true);
        try {
            await adminAwardAchievement(userId.trim(), awardModal.key);
            showToast(`Achievement "${awardModal.name}" awarded!`);
            setAwardModal(null);
            setUserId("");
        } catch (e: unknown) {
            showToast(e instanceof Error ? e.message : "Failed to award.");
        } finally {
            setAwarding(false);
        }
    }

    if (loading) return <div style={{ textAlign: "center", padding: "60px 0", color: "var(--admin-muted)" }}><div className="aspinner" style={{ margin: "0 auto 12px" }} />Loading…</div>;
    if (error) return <div className="aalert aalert-error">{error}</div>;

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Achievement Management</h1>
                <p className="page-sub">{types.length} achievement types · Click any card to manually award</p>
            </div>

            {toast && <div className="aalert aalert-success" style={{ marginBottom: 16 }}>{toast}</div>}

            {types.length === 0 ? (
                <div className="aempty"><div className="aempty-icon">🏆</div>No achievement types found.</div>
            ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 14 }}>
                    {types.map((t) => {
                        const stat = stats.get(t.key);
                        return (
                            <div
                                key={t._id}
                                className="acard"
                                style={{ cursor: "pointer", transition: "border-color 0.15s", borderColor: "var(--admin-border)" }}
                                onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(99,102,241,0.4)")}
                                onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--admin-border)")}
                                onClick={() => { setAwardModal(t); setUserId(""); }}
                            >
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                                    <div>
                                        <div style={{ fontWeight: 700, fontSize: 14 }}>{t.name}</div>
                                        <div style={{ fontSize: 11, color: "var(--admin-muted)", marginTop: 2 }}>{t.key}</div>
                                    </div>
                                    <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end" }}>
                                        <span className={`abadge ${CAT_COLOR[t.category] ?? "abadge-gray"}`}>{t.category}</span>
                                        <span className={`abadge ${t.isActive ? "abadge-green" : "abadge-gray"}`}>{t.isActive ? "active" : "inactive"}</span>
                                    </div>
                                </div>

                                {t.description && (
                                    <p style={{ fontSize: 12, color: "var(--admin-muted)", marginBottom: 10, lineHeight: 1.5 }}>{t.description}</p>
                                )}

                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                                    <div style={{ background: "var(--admin-surface2)", borderRadius: 8, padding: "8px 10px" }}>
                                        <div style={{ fontSize: 10, color: "var(--admin-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Minted</div>
                                        <div style={{ fontSize: 18, fontWeight: 700, marginTop: 2 }}>{t.mintedCount.toLocaleString()}</div>
                                    </div>
                                    <div style={{ background: "var(--admin-surface2)", borderRadius: 8, padding: "8px 10px" }}>
                                        <div style={{ fontSize: 10, color: "var(--admin-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>% Users</div>
                                        <div style={{ fontSize: 18, fontWeight: 700, marginTop: 2 }}>{stat?.percentOfUsers ?? 0}%</div>
                                    </div>
                                </div>

                                {t.maxSupply != null && (
                                    <div style={{ marginTop: 10 }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--admin-muted)", marginBottom: 4 }}>
                                            <span>Supply</span><span>{t.mintedCount} / {t.maxSupply}</span>
                                        </div>
                                        <div style={{ height: 4, borderRadius: 2, background: "var(--admin-surface2)", overflow: "hidden" }}>
                                            <div style={{ width: `${Math.round((t.mintedCount / t.maxSupply) * 100)}%`, height: "100%", background: "var(--admin-accent)", borderRadius: 2 }} />
                                        </div>
                                    </div>
                                )}

                                <button className="abtn abtn-outline abtn-sm" style={{ marginTop: 12, width: "100%", justifyContent: "center" }}>
                                    <BadgeCheck size={12} /> Award Manually
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Award Modal */}
            {awardModal && (
                <div className="amodal-backdrop">
                    <div className="amodal">
                        <div className="amodal-title">Award &ldquo;{awardModal.name}&rdquo;</div>
                        <p style={{ fontSize: 13, color: "var(--admin-muted)" }}>
                            Manually grant this achievement to a user by entering their User ID.
                        </p>
                        <div className="aform-group">
                            <label className="aform-label">User ID (MongoDB ObjectId)</label>
                            <input
                                className="ainput"
                                placeholder="64f1a2b3c4d5e6f7a8b9c0d1"
                                value={userId}
                                onChange={(e) => setUserId(e.target.value)}
                            />
                        </div>
                        <div className="amodal-actions">
                            <button className="abtn abtn-outline" onClick={() => setAwardModal(null)}>Cancel</button>
                            <button className="abtn abtn-primary" disabled={awarding || !userId.trim()} onClick={handleAward}>
                                {awarding ? <span className="aspinner" /> : <BadgeCheck size={14} />}
                                Award Achievement
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
