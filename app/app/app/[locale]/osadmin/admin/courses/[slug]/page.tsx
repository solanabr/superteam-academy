"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { adminGetCourses, adminUpdateCourse, adminArchiveCourse, adminDeleteCourse, adminPublishCourse, AdminCourse } from "@/lib/admin";
import { ArrowLeft, Save, Globe, Archive, Trash2 } from "lucide-react";
import Link from "next/link";

const DIFFICULTIES = ["beginner", "intermediate", "advanced"];
const TOPICS = ["solana-basics", "smart-contracts", "defi", "nfts", "tokens", "web3-frontend", "security", "tooling"];

export default function AdminCourseDetailPage() {
    const { slug } = useParams<{ slug: string }>();
    const router = useRouter();
    const [course, setCourse] = useState<AdminCourse | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState("");
    const [error, setError] = useState("");
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [form, setForm] = useState({ title: "", difficulty: "", topic: "", status: "" });

    function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(""), 2500); }

    useEffect(() => {
        adminGetCourses({ limit: 100 })
            .then((r) => {
                const c = r.data.find((x) => x.slug === slug);
                if (!c) { setError("Course not found."); return; }
                setCourse(c);
                setForm({ title: c.title, difficulty: c.difficulty, topic: c.topic, status: c.status });
            })
            .catch(() => setError("Failed to load course."))
            .finally(() => setLoading(false));
    }, [slug]);

    async function handleSave() {
        setSaving(true);
        try {
            await adminUpdateCourse(slug, { title: form.title, difficulty: form.difficulty as AdminCourse["difficulty"], topic: form.topic });
            showToast("Course updated!");
        } catch { showToast("Save failed."); }
        finally { setSaving(false); }
    }

    async function handlePublish() {
        setSaving(true);
        try { await adminPublishCourse(slug); showToast("Course published!"); router.push("/osadmin/admin/courses"); }
        catch { showToast("Publish failed."); setSaving(false); }
    }

    async function handleArchive() {
        setSaving(true);
        try { await adminArchiveCourse(slug); showToast("Course archived."); router.push("/osadmin/admin/courses"); }
        catch { showToast("Archive failed."); setSaving(false); }
    }

    async function handleDelete() {
        setSaving(true); setConfirmDelete(false);
        try { await adminDeleteCourse(slug); router.push("/osadmin/admin/courses"); }
        catch { showToast("Delete failed — only drafts may be deleted."); setSaving(false); }
    }

    if (loading) return <div style={{ textAlign: "center", padding: 60, color: "var(--admin-muted)" }}><div className="aspinner" style={{ margin: "0 auto 12px" }} />Loading…</div>;
    if (error) return <div className="aalert aalert-error">{error}</div>;
    if (!course) return null;

    return (
        <div>
            <div style={{ marginBottom: 20 }}>
                <Link href="/osadmin/admin/courses" className="abtn abtn-outline abtn-sm">
                    <ArrowLeft size={13} /> Back to Courses
                </Link>
            </div>

            {toast && <div className="aalert aalert-success" style={{ marginBottom: 16 }}>{toast}</div>}

            <div className="page-header">
                <h1 className="page-title">{course.title}</h1>
                <p className="page-sub">/{course.slug} &bull; Created {new Date(course.createdAt).toLocaleDateString()}</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20, alignItems: "start" }}>
                {/* Edit Form */}
                <div className="acard" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <h2 style={{ fontSize: 14, fontWeight: 700 }}>Edit Metadata</h2>

                    <div className="aform-group">
                        <label className="aform-label">Title</label>
                        <input className="ainput" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                    </div>

                    <div className="aform-row">
                        <div className="aform-group">
                            <label className="aform-label">Difficulty</label>
                            <select className="aselect" style={{ width: "100%" }} value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })}>
                                {DIFFICULTIES.map((d) => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </div>
                        <div className="aform-group">
                            <label className="aform-label">Topic</label>
                            <select className="aselect" style={{ width: "100%" }} value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })}>
                                {TOPICS.map((t) => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                    </div>

                    <button className="abtn abtn-primary" disabled={saving} onClick={handleSave} style={{ alignSelf: "flex-start" }}>
                        {saving ? <span className="aspinner" /> : <Save size={14} />} Save Changes
                    </button>
                </div>

                {/* Stats + Actions */}
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <div className="acard">
                        <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>Stats</h2>
                        {[
                            ["Status", <span key="s" className={`abadge ${course.status === "published" ? "abadge-green" : course.status === "draft" ? "abadge-yellow" : "abadge-gray"}`}>{course.status}</span>],
                            ["Enrollments", course.enrollmentCount.toLocaleString()],
                            ["Completions", course.completionCount.toLocaleString()],
                            ["Completion Rate", `${course.enrollmentCount > 0 ? Math.round((course.completionCount / course.enrollmentCount) * 100) : 0}%`],
                            ["Rating", course.ratingCount > 0 ? `⭐ ${course.rating.toFixed(1)} (${course.ratingCount})` : "—"],
                            ["XP", course.totalXP.toLocaleString()],
                        ].map(([k, v]) => (
                            <div key={String(k)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: "1px solid var(--admin-border)", fontSize: 13 }}>
                                <span style={{ color: "var(--admin-muted)" }}>{k}</span>
                                <span style={{ fontWeight: 600 }}>{v}</span>
                            </div>
                        ))}
                    </div>

                    <div className="acard">
                        <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Actions</h2>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            {course.status === "draft" && (
                                <button className="abtn abtn-success" disabled={saving} onClick={handlePublish}>
                                    <Globe size={14} /> Publish Course
                                </button>
                            )}
                            {course.status === "published" && (
                                <button className="abtn abtn-outline" disabled={saving} onClick={handleArchive}>
                                    <Archive size={14} /> Archive Course
                                </button>
                            )}
                            {course.status === "draft" && (
                                <button className="abtn abtn-danger" disabled={saving} onClick={() => setConfirmDelete(true)}>
                                    <Trash2 size={14} /> Delete Draft
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {confirmDelete && (
                <div className="amodal-backdrop">
                    <div className="amodal">
                        <div className="amodal-title">Delete this course?</div>
                        <p style={{ fontSize: 13, color: "var(--admin-muted)" }}>This is permanent. Only draft courses can be deleted.</p>
                        <div className="amodal-actions">
                            <button className="abtn abtn-outline" onClick={() => setConfirmDelete(false)}>Cancel</button>
                            <button className="abtn abtn-danger" onClick={handleDelete}>Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
