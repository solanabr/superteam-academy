"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import {
    adminGetUsers, adminSetRole, adminBanUser,
    AdminUser, Pagination,
} from "@/lib/admin";
import { Search, ChevronLeft, ChevronRight, Shield, ShieldOff, ExternalLink } from "lucide-react";

function fmtDate(d?: string) {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function AdminUsersPage() {
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 20, totalPages: 1 });
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [role, setRole] = useState("");
    const [page, setPage] = useState(1);
    const [actionId, setActionId] = useState<string | null>(null);
    const [error, setError] = useState("");
    const [toast, setToast] = useState("");

    const load = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const res = await adminGetUsers({ search: search || undefined, role: role || undefined, page, limit: 20 });
            setUsers(res.data);
            setPagination(res.pagination);
        } catch {
            setError("Failed to load users.");
        } finally {
            setLoading(false);
        }
    }, [search, role, page]);

    useEffect(() => { load(); }, [load]);

    function showToast(msg: string) {
        setToast(msg);
        setTimeout(() => setToast(""), 2500);
    }

    async function toggleBan(user: AdminUser) {
        setActionId(user._id);
        try {
            await adminBanUser(user._id, !user.isBanned);
            showToast(user.isBanned ? `${user.username || "User"} unbanned` : `${user.username || "User"} banned`);
            load();
        } catch {
            showToast("Action failed.");
        } finally {
            setActionId(null);
        }
    }

    async function toggleRole(user: AdminUser) {
        setActionId(user._id);
        const newRole = user.role === "admin" ? "user" : "admin";
        try {
            await adminSetRole(user._id, newRole);
            showToast(`${user.username || "User"} is now ${newRole}`);
            load();
        } catch {
            showToast("Action failed.");
        } finally {
            setActionId(null);
        }
    }

    return (
        <div>
            <div className="page-header" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                <div>
                    <h1 className="page-title">User Management</h1>
                    <p className="page-sub">{pagination.total.toLocaleString()} total users</p>
                </div>
            </div>

            {toast && <div className="aalert aalert-success" style={{ marginBottom: 16 }}>{toast}</div>}
            {error && <div className="aalert aalert-error" style={{ marginBottom: 16 }}>{error}</div>}

            {/* Filters */}
            <div className="acard" style={{ marginBottom: 16 }}>
                <div className="aform-row">
                    <div className="aform-group" style={{ maxWidth: 360 }}>
                        <div style={{ position: "relative" }}>
                            <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--admin-muted)" }} />
                            <input
                                className="ainput"
                                style={{ paddingLeft: 32 }}
                                placeholder="Search by name, username or email…"
                                value={search}
                                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                            />
                        </div>
                    </div>
                    <div className="aform-group" style={{ maxWidth: 160, flex: "0 0 auto" }}>
                        <select className="aselect" value={role} onChange={(e) => { setRole(e.target.value); setPage(1); }}>
                            <option value="">All roles</option>
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="acard">
                {loading ? (
                    <div style={{ textAlign: "center", padding: "40px 0", color: "var(--admin-muted)" }}>
                        <div className="aspinner" style={{ margin: "0 auto 10px" }} /> Loading users…
                    </div>
                ) : users.length === 0 ? (
                    <div className="aempty"><div className="aempty-icon">👥</div>No users found.</div>
                ) : (
                    <div className="atable-wrap">
                        <table className="atable">
                            <thead>
                                <tr>
                                    <th>User</th>
                                    <th>Role</th>
                                    <th>Level / XP</th>
                                    <th>Streak</th>
                                    <th>Last Active</th>
                                    <th>Joined</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((u) => (
                                    <tr key={u._id}>
                                        <td>
                                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                                {u.avatar ? (
                                                    <Image src={u.avatar} alt="" width={30} height={30} style={{ borderRadius: "50%", objectFit: "cover" }} />
                                                ) : (
                                                    <div style={{ width: 30, height: 30, borderRadius: "50%", background: "rgba(99,102,241,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "var(--admin-accent)", flexShrink: 0 }}>
                                                        {(u.username || u.name || "?")[0].toUpperCase()}
                                                    </div>
                                                )}
                                                <div>
                                                    <div style={{ fontWeight: 600, fontSize: 13 }}>{u.name || u.username || "—"}</div>
                                                    <div style={{ fontSize: 11, color: "var(--admin-muted)" }}>{u.email || u.username || ""}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`abadge ${u.role === "admin" ? "abadge-purple" : "abadge-gray"}`}>
                                                {u.role}
                                            </span>
                                            {u.isBanned && <span className="abadge abadge-red" style={{ marginLeft: 4 }}>banned</span>}
                                        </td>
                                        <td>
                                            <span style={{ fontSize: 13, fontWeight: 600 }}>Lv {u.level}</span>
                                            <span style={{ fontSize: 11, color: "var(--admin-muted)", marginLeft: 6 }}>{u.totalXP.toLocaleString()} XP</span>
                                        </td>
                                        <td style={{ fontSize: 13 }}>{u.currentStreak}d</td>
                                        <td style={{ fontSize: 12, color: "var(--admin-muted)" }}>{fmtDate(u.lastActive)}</td>
                                        <td style={{ fontSize: 12, color: "var(--admin-muted)" }}>{fmtDate(u.createdAt)}</td>
                                        <td>
                                            <div style={{ display: "flex", gap: 6 }}>
                                                <Link href={`/osadmin/admin/users/${u._id}`} className="abtn abtn-outline abtn-sm">
                                                    <ExternalLink size={12} /> View
                                                </Link>
                                                <button
                                                    className={`abtn abtn-sm ${u.isBanned ? "abtn-success" : "abtn-danger"}`}
                                                    disabled={actionId === u._id}
                                                    onClick={() => toggleBan(u)}
                                                >
                                                    {actionId === u._id ? <span className="aspinner" /> : u.isBanned ? <ShieldOff size={12} /> : <Shield size={12} />}
                                                    {u.isBanned ? "Unban" : "Ban"}
                                                </button>
                                                <button
                                                    className="abtn abtn-outline abtn-sm"
                                                    disabled={actionId === u._id}
                                                    onClick={() => toggleRole(u)}
                                                >
                                                    {u.role === "admin" ? "Demote" : "Promote"}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                    <div className="apagination">
                        <span className="apagination-info">
                            {((page - 1) * 20 + 1)}–{Math.min(page * 20, pagination.total)} of {pagination.total.toLocaleString()}
                        </span>
                        <button className="abtn abtn-outline abtn-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                            <ChevronLeft size={14} />
                        </button>
                        <span style={{ fontSize: 13, color: "var(--admin-muted)" }}>{page} / {pagination.totalPages}</span>
                        <button className="abtn abtn-outline abtn-sm" disabled={page >= pagination.totalPages} onClick={() => setPage(p => p + 1)}>
                            <ChevronRight size={14} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
