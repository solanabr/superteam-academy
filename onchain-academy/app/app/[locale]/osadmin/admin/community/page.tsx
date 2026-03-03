"use client";

import { useEffect, useState, useCallback } from "react";
import { adminGetThreads, adminPinThread, adminLockThread, adminDeleteThread, Thread, Pagination } from "@/lib/admin";
import { Pin, Lock, Trash2, ChevronLeft, ChevronRight } from "lucide-react";

function fmtDate(d?: string) {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function AdminCommunityPage() {
    const [threads, setThreads] = useState<Thread[]>([]);
    const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 20, totalPages: 1 });
    const [loading, setLoading] = useState(true);
    const [type, setType] = useState("");
    const [sort, setSort] = useState("latest");
    const [page, setPage] = useState(1);
    const [actionId, setActionId] = useState<string | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<Thread | null>(null);
    const [toast, setToast] = useState("");
    const [error, setError] = useState("");

    const load = useCallback(async () => {
        setLoading(true); setError("");
        try {
            const res = await adminGetThreads({ type: type || undefined, sort, page, limit: 20 });
            setThreads(res.data);
            setPagination(res.pagination);
        } catch { setError("Failed to load threads."); }
        finally { setLoading(false); }
    }, [type, sort, page]);

    useEffect(() => { load(); }, [load]);

    function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(""), 2500); }

    async function handlePin(t: Thread) {
        setActionId(t._id);
        try { await adminPinThread(t._id); showToast(t.isPinned ? "Thread unpinned" : "Thread pinned"); load(); }
        catch { showToast("Failed."); }
        finally { setActionId(null); }
    }

    async function handleLock(t: Thread) {
        setActionId(t._id);
        try { await adminLockThread(t._id); showToast(t.isLocked ? "Thread unlocked" : "Thread locked"); load(); }
        catch { showToast("Failed."); }
        finally { setActionId(null); }
    }

    async function handleDelete() {
        if (!confirmDelete) return;
        setActionId(confirmDelete._id);
        setConfirmDelete(null);
        try { await adminDeleteThread(confirmDelete._id); showToast("Thread deleted."); load(); }
        catch { showToast("Failed."); }
        finally { setActionId(null); }
    }

    function getAuthorName(thread: Thread): string {
        if (typeof thread.authorId === "object" && thread.authorId) {
            return thread.authorId.username || thread.authorId.name || "Unknown";
        }
        return "Unknown";
    }

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Community Moderation</h1>
                <p className="page-sub">{pagination.total.toLocaleString()} threads</p>
            </div>

            {toast && <div className="aalert aalert-success" style={{ marginBottom: 16 }}>{toast}</div>}
            {error && <div className="aalert aalert-error" style={{ marginBottom: 16 }}>{error}</div>}

            {/* Filters */}
            <div className="acard" style={{ marginBottom: 16 }}>
                <div className="aform-row">
                    <div className="aform-group" style={{ maxWidth: 180 }}>
                        <label className="aform-label">Type</label>
                        <select className="aselect" value={type} onChange={(e) => { setType(e.target.value); setPage(1); }}>
                            <option value="">All types</option>
                            <option value="discussion">Discussion</option>
                            <option value="question">Question</option>
                        </select>
                    </div>
                    <div className="aform-group" style={{ maxWidth: 180 }}>
                        <label className="aform-label">Sort</label>
                        <select className="aselect" value={sort} onChange={(e) => { setSort(e.target.value); setPage(1); }}>
                            <option value="latest">Latest</option>
                            <option value="top">Top voted</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="acard">
                {loading ? (
                    <div style={{ textAlign: "center", padding: "40px 0", color: "var(--admin-muted)" }}>
                        <div className="aspinner" style={{ margin: "0 auto 10px" }} /> Loading threads…
                    </div>
                ) : threads.length === 0 ? (
                    <div className="aempty"><div className="aempty-icon">💬</div>No threads found.</div>
                ) : (
                    <div className="atable-wrap">
                        <table className="atable">
                            <thead>
                                <tr>
                                    <th>Thread</th>
                                    <th>Author</th>
                                    <th>Type</th>
                                    <th>Upvotes</th>
                                    <th>Replies</th>
                                    <th>Flags</th>
                                    <th>Date</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {threads.map((t) => (
                                    <tr key={t._id}>
                                        <td style={{ maxWidth: 260 }}>
                                            <div style={{ fontWeight: 600, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                {t.title}
                                            </div>
                                        </td>
                                        <td style={{ fontSize: 12, color: "var(--admin-muted)" }}>{getAuthorName(t)}</td>
                                        <td><span className={`abadge ${t.type === "question" ? "abadge-blue" : "abadge-purple"}`}>{t.type}</span></td>
                                        <td style={{ fontSize: 13 }}>{t.upvotes.length}</td>
                                        <td style={{ fontSize: 13 }}>{t.replyCount}</td>
                                        <td>
                                            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                                                {t.isPinned && <span className="abadge abadge-yellow">📌 pinned</span>}
                                                {t.isLocked && <span className="abadge abadge-red">🔒 locked</span>}
                                                {t.isSolved && <span className="abadge abadge-green">✅ solved</span>}
                                            </div>
                                        </td>
                                        <td style={{ fontSize: 12, color: "var(--admin-muted)" }}>{fmtDate(t.createdAt)}</td>
                                        <td>
                                            <div style={{ display: "flex", gap: 5 }}>
                                                <button
                                                    className={`abtn abtn-sm ${t.isPinned ? "abtn-warning" : "abtn-outline"}`}
                                                    style={t.isPinned ? { background: "rgba(245,158,11,0.12)", color: "#f59e0b" } : {}}
                                                    title={t.isPinned ? "Unpin" : "Pin"}
                                                    disabled={actionId === t._id}
                                                    onClick={() => handlePin(t)}
                                                >
                                                    <Pin size={11} />
                                                </button>
                                                <button
                                                    className={`abtn abtn-sm ${t.isLocked ? "abtn-danger" : "abtn-outline"}`}
                                                    title={t.isLocked ? "Unlock" : "Lock"}
                                                    disabled={actionId === t._id}
                                                    onClick={() => handleLock(t)}
                                                >
                                                    <Lock size={11} />
                                                </button>
                                                <button
                                                    className="abtn abtn-danger abtn-sm"
                                                    title="Delete"
                                                    disabled={actionId === t._id}
                                                    onClick={() => setConfirmDelete(t)}
                                                >
                                                    <Trash2 size={11} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
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

            {confirmDelete && (
                <div className="amodal-backdrop">
                    <div className="amodal">
                        <div className="amodal-title">Delete thread?</div>
                        <p style={{ fontSize: 13, color: "var(--admin-muted)", wordBreak: "break-word" }}>&ldquo;{confirmDelete.title}&rdquo;</p>
                        <div className="amodal-actions">
                            <button className="abtn abtn-outline" onClick={() => setConfirmDelete(null)}>Cancel</button>
                            <button className="abtn abtn-danger" onClick={handleDelete}>Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
