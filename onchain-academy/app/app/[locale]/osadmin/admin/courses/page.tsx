"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
    adminGetCourses, adminArchiveCourse, adminDeleteCourse, adminPublishCourse,
    AdminCourse, Pagination,
} from "@/lib/admin";
import { Plus, ChevronLeft, ChevronRight, Archive, Trash2, Globe, ExternalLink } from "lucide-react";

const DIFF_COLOR: Record<string, string> = { beginner: "abadge-green", intermediate: "abadge-yellow", advanced: "abadge-red" };
const STATUS_COLOR: Record<string, string> = { published: "abadge-green", draft: "abadge-yellow", archived: "abadge-gray" };

function fmtDate(d?: string) {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function AdminCoursesPage() {
    const [courses, setCourses] = useState<AdminCourse[]>([]);
    const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 20, totalPages: 1 });
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState("");
    const [page, setPage] = useState(1);
    const [actionSlug, setActionSlug] = useState<string | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<AdminCourse | null>(null);
    const [toast, setToast] = useState("");
    const [error, setError] = useState("");

    const load = useCallback(async () => {
        setLoading(true); setError("");
        try {
            const res = await adminGetCourses({ status: status || undefined, page, limit: 20 });
            setCourses(res.data);
            setPagination(res.pagination);
        } catch { setError("Failed to load courses."); }
        finally { setLoading(false); }
    }, [status, page]);

    useEffect(() => { load(); }, [load]);

    function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(""), 2500); }

    async function handleArchive(slug: string) {
        setActionSlug(slug);
        try { await adminArchiveCourse(slug); showToast("Course archived."); load(); }
        catch { showToast("Failed."); }
        finally { setActionSlug(null); }
    }

    async function handlePublish(slug: string) {
        setActionSlug(slug);
        try { await adminPublishCourse(slug); showToast("Course published!"); load(); }
        catch { showToast("Failed."); }
        finally { setActionSlug(null); }
    }

    async function handleDelete() {
        if (!confirmDelete) return;
        setActionSlug(confirmDelete.slug);
        setConfirmDelete(null);
        try { await adminDeleteCourse(confirmDelete.slug); showToast("Course deleted."); load(); }
        catch { showToast("Failed. Only drafts can be deleted."); }
        finally { setActionSlug(null); }
    }

    const TABS = ["", "published", "draft", "archived"];
    const TAB_LABELS = ["All", "Published", "Draft", "Archived"];

    return (
        <div>
            <div className="page-header" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                <div>
                    <h1 className="page-title">Course Management</h1>
                    <p className="page-sub">{pagination.total.toLocaleString()} courses</p>
                </div>
                <Link href="/osadmin/admin/courses/new" className="abtn abtn-primary">
                    <Plus size={15} /> New Course
                </Link>
            </div>

            {toast && <div className="aalert aalert-success" style={{ marginBottom: 16 }}>{toast}</div>}
            {error && <div className="aalert aalert-error" style={{ marginBottom: 16 }}>{error}</div>}

            {/* Status Tabs */}
            <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
                {TABS.map((t, i) => (
                    <button
                        key={t}
                        className="abtn abtn-sm"
                        style={{ background: status === t ? "var(--admin-accent)" : "var(--admin-surface2)", color: status === t ? "#fff" : "var(--admin-muted)", border: "1px solid var(--admin-border)" }}
                        onClick={() => { setStatus(t); setPage(1); }}
                    >
                        {TAB_LABELS[i]}
                    </button>
                ))}
            </div>

            <div className="acard">
                {loading ? (
                    <div style={{ textAlign: "center", padding: "40px 0", color: "var(--admin-muted)" }}>
                        <div className="aspinner" style={{ margin: "0 auto 10px" }} /> Loading courses…
                    </div>
                ) : courses.length === 0 ? (
                    <div className="aempty"><div className="aempty-icon">📚</div>No courses found.</div>
                ) : (
                    <div className="atable-wrap">
                        <table className="atable">
                            <thead>
                                <tr>
                                    <th>Course</th>
                                    <th>Status</th>
                                    <th>Difficulty</th>
                                    <th>Enrollments</th>
                                    <th>Completions</th>
                                    <th>Rate</th>
                                    <th>Rating</th>
                                    <th>Created</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {courses.map((c) => {
                                    const rate = c.enrollmentCount > 0 ? Math.round((c.completionCount / c.enrollmentCount) * 100) : 0;
                                    return (
                                        <tr key={c._id}>
                                            <td>
                                                <div style={{ fontWeight: 600, fontSize: 13 }}>{c.title}</div>
                                                <div style={{ fontSize: 11, color: "var(--admin-muted)" }}>{c.slug}</div>
                                            </td>
                                            <td><span className={`abadge ${STATUS_COLOR[c.status] || "abadge-gray"}`}>{c.status}</span></td>
                                            <td><span className={`abadge ${DIFF_COLOR[c.difficulty] || "abadge-gray"}`}>{c.difficulty}</span></td>
                                            <td style={{ fontSize: 13 }}>{c.enrollmentCount.toLocaleString()}</td>
                                            <td style={{ fontSize: 13 }}>{c.completionCount.toLocaleString()}</td>
                                            <td><span className={`abadge ${rate >= 70 ? "abadge-green" : rate >= 40 ? "abadge-yellow" : "abadge-red"}`}>{rate}%</span></td>
                                            <td style={{ fontSize: 13 }}>
                                                {c.ratingCount > 0 ? `⭐ ${c.rating.toFixed(1)} (${c.ratingCount})` : "—"}
                                            </td>
                                            <td style={{ fontSize: 12, color: "var(--admin-muted)" }}>{fmtDate(c.createdAt)}</td>
                                            <td>
                                                <div style={{ display: "flex", gap: 5 }}>
                                                    <Link href={`/osadmin/admin/courses/${c.slug}`} className="abtn abtn-outline abtn-sm">
                                                        <ExternalLink size={11} /> Edit
                                                    </Link>
                                                    {c.status === "draft" && (
                                                        <button
                                                            className="abtn abtn-success abtn-sm"
                                                            disabled={actionSlug === c.slug}
                                                            onClick={() => handlePublish(c.slug)}
                                                        >
                                                            {actionSlug === c.slug ? <span className="aspinner" /> : <Globe size={11} />} Publish
                                                        </button>
                                                    )}
                                                    {c.status === "published" && (
                                                        <button
                                                            className="abtn abtn-outline abtn-sm"
                                                            disabled={actionSlug === c.slug}
                                                            onClick={() => handleArchive(c.slug)}
                                                        >
                                                            {actionSlug === c.slug ? <span className="aspinner" /> : <Archive size={11} />} Archive
                                                        </button>
                                                    )}
                                                    {c.status === "draft" && (
                                                        <button
                                                            className="abtn abtn-danger abtn-sm"
                                                            disabled={actionSlug === c.slug}
                                                            onClick={() => setConfirmDelete(c)}
                                                        >
                                                            <Trash2 size={11} /> Delete
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {pagination.totalPages > 1 && (
                    <div className="apagination">
                        <span className="apagination-info">{((page - 1) * 20 + 1)}–{Math.min(page * 20, pagination.total)} of {pagination.total.toLocaleString()}</span>
                        <button className="abtn abtn-outline abtn-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}><ChevronLeft size={14} /></button>
                        <span style={{ fontSize: 13, color: "var(--admin-muted)" }}>{page} / {pagination.totalPages}</span>
                        <button className="abtn abtn-outline abtn-sm" disabled={page >= pagination.totalPages} onClick={() => setPage(p => p + 1)}><ChevronRight size={14} /></button>
                    </div>
                )}
            </div>

            {/* Delete Confirm Modal */}
            {confirmDelete && (
                <div className="amodal-backdrop">
                    <div className="amodal">
                        <div className="amodal-title">Delete &ldquo;{confirmDelete.title}&rdquo;?</div>
                        <p style={{ fontSize: 13, color: "var(--admin-muted)" }}>This action is permanent and cannot be undone. Only draft courses can be deleted.</p>
                        <div className="amodal-actions">
                            <button className="abtn abtn-outline" onClick={() => setConfirmDelete(null)}>Cancel</button>
                            <button className="abtn abtn-danger" onClick={handleDelete}>Yes, Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
