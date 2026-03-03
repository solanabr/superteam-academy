/**
 * User table component for admin user management.
 *
 * Displays users in a sortable table with pagination and action controls.
 * Delete uses a GitHub-style inline "type DELETE to confirm" modal.
 */

'use client';

import { useState } from 'react';

interface UserRow {
    id: string;
    name: string | null;
    email: string | null;
    username: string | null;
    wallet_address: string | null;
    role?: string;
    login_count: number;
    last_login_at: string | null;
    created_at: string;
    linked_accounts_count: number;
    streak: { current_streak: number; longest_streak: number } | null;
}

interface UserTableProps {
    users: UserRow[];
    page: number;
    totalPages: number;
    total: number;
    onPageChange: (page: number) => void;
    onRefresh?: () => void;
}

function formatDate(iso: string | null): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

function truncateWallet(addr: string | null): string {
    if (!addr) return '—';
    return `${addr.slice(0, 4)}…${addr.slice(-4)}`;
}

/* ── GitHub-style delete confirmation modal ── */
function DeleteConfirmModal({
    userName,
    onConfirm,
    onCancel,
    isLoading,
}: {
    userName: string;
    onConfirm: () => void;
    onCancel: () => void;
    isLoading: boolean;
}) {
    const [input, setInput] = useState('');
    const matches = input.trim().toUpperCase() === 'DELETE';

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 9999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(0,0,0,0.6)',
                backdropFilter: 'blur(4px)',
            }}
            onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
        >
            <div
                style={{
                    background: '#161b22',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    padding: '24px',
                    width: '100%',
                    maxWidth: '440px',
                    margin: '0 16px',
                }}
            >
                {/* Warning banner */}
                <div
                    style={{
                        background: 'rgba(248,113,113,0.08)',
                        border: '1px solid rgba(248,113,113,0.2)',
                        borderRadius: '8px',
                        padding: '12px 16px',
                        marginBottom: '16px',
                    }}
                >
                    <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#f87171' }}>
                        WARNING: Are you sure you want to delete this user?
                    </p>
                    <p style={{ margin: '6px 0 0', fontSize: '12px', color: 'rgba(248,113,113,0.7)', lineHeight: 1.5 }}>
                        This will soft-delete <strong style={{ color: '#f87171' }}>{userName}</strong>.
                        The user will lose access immediately. This action can only be reversed in the database.
                    </p>
                </div>

                {/* Confirmation input */}
                <label
                    style={{
                        display: 'block',
                        fontSize: '13px',
                        color: 'rgba(255,255,255,0.6)',
                        marginBottom: '8px',
                    }}
                >
                    To confirm, type <strong style={{ color: '#fff' }}>DELETE</strong> below:
                </label>
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="DELETE"
                    autoFocus
                    disabled={isLoading}
                    style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '6px',
                        border: '1px solid rgba(255,255,255,0.15)',
                        background: 'rgba(255,255,255,0.04)',
                        color: '#fff',
                        fontSize: '14px',
                        fontFamily: 'var(--font-geist-mono), monospace',
                        outline: 'none',
                        boxSizing: 'border-box',
                    }}
                    onKeyDown={(e) => { if (e.key === 'Enter' && matches && !isLoading) onConfirm(); }}
                />

                {/* Actions */}
                <div style={{ display: 'flex', gap: '8px', marginTop: '16px', justifyContent: 'flex-end' }}>
                    <button
                        onClick={onCancel}
                        disabled={isLoading}
                        style={{
                            padding: '8px 16px',
                            borderRadius: '6px',
                            border: '1px solid rgba(255,255,255,0.1)',
                            background: 'rgba(255,255,255,0.04)',
                            color: '#fff',
                            fontSize: '13px',
                            cursor: 'pointer',
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={!matches || isLoading}
                        style={{
                            padding: '8px 16px',
                            borderRadius: '6px',
                            border: 'none',
                            background: matches ? '#dc2626' : 'rgba(220,38,38,0.3)',
                            color: matches ? '#fff' : 'rgba(255,255,255,0.3)',
                            fontSize: '13px',
                            fontWeight: 600,
                            cursor: matches ? 'pointer' : 'not-allowed',
                            transition: 'all 0.2s',
                        }}
                    >
                        {isLoading ? 'Deleting…' : 'Delete this user'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export function UserTable({ users, page, totalPages, total, onPageChange, onRefresh }: UserTableProps) {
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const cellStyle: React.CSSProperties = {
        padding: '12px 16px',
        fontSize: '13px',
        color: 'rgba(255,255,255,0.8)',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        whiteSpace: 'nowrap',
        textAlign: 'left',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
    };

    const headerStyle: React.CSSProperties = {
        ...cellStyle,
        fontSize: '11px',
        fontWeight: 600,
        color: 'rgba(255,255,255,0.4)',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
    };

    const getRoleBadgeStyle = (role: string): React.CSSProperties => {
        if (role === 'admin') {
            return {
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: 600,
                background: 'rgba(245,158,11,0.15)',
                color: '#fbbf24',
                border: '1px solid rgba(245,158,11,0.3)',
            };
        }
        return {
            padding: '2px 8px',
            borderRadius: '4px',
            fontSize: '11px',
            fontWeight: 600,
            background: 'rgba(99,102,241,0.15)',
            color: '#818cf8',
            border: '1px solid rgba(99,102,241,0.3)',
        };
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setActionLoading(deleteTarget.id);
        setErrorMsg(null);
        try {
            const res = await fetch(`/api/admin/users/${deleteTarget.id}`, {
                method: 'DELETE',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({ error: 'Unknown error' }));
                setErrorMsg(data.error || `Failed to delete (${res.status})`);
                return;
            }
            setDeleteTarget(null);
            onRefresh?.();
        } catch (err) {
            setErrorMsg('Network error — check console');
            console.error('Delete failed:', err);
        } finally {
            setActionLoading(null);
        }
    };

    return (
        <div>
            {/* Error banner */}
            {errorMsg && (
                <div style={{
                    padding: '10px 16px',
                    background: 'rgba(248,113,113,0.1)',
                    borderBottom: '1px solid rgba(248,113,113,0.2)',
                    fontSize: '13px',
                    color: '#f87171',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }}>
                    <span>Error: {errorMsg}</span>
                    <button
                        onClick={() => setErrorMsg(null)}
                        style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: '16px' }}
                    >
                        ×
                    </button>
                </div>
            )}

            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                    <colgroup>
                        <col style={{ width: '20%' }} />
                        <col style={{ width: '14%' }} />
                        <col style={{ width: '10%' }} />
                        <col style={{ width: '10%' }} />
                        <col style={{ width: '18%' }} />
                        <col style={{ width: '16%' }} />
                        <col style={{ width: '12%' }} />
                    </colgroup>
                    <thead>
                        <tr>
                            <th style={headerStyle}>User</th>
                            <th style={headerStyle}>Wallet</th>
                            <th style={headerStyle}>Role</th>
                            <th style={headerStyle}>Logins</th>
                            <th style={headerStyle}>Streak</th>
                            <th style={headerStyle}>Joined</th>
                            <th style={{ ...headerStyle, textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user) => {
                            const isLoading = actionLoading === user.id;
                            const currentRole = user.role || 'student';

                            return (
                                <tr key={user.id} style={{ opacity: isLoading ? 0.5 : 1, transition: 'opacity 0.2s' }}>
                                    <td style={cellStyle}>
                                        <div>
                                            <div style={{ fontWeight: 500, color: '#fff' }}>
                                                {user.name || user.username || 'Anonymous'}
                                            </div>
                                            {user.email && (
                                                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', marginTop: '2px' }}>
                                                    {user.email}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td style={{ ...cellStyle, fontFamily: 'var(--font-geist-mono)' }}>
                                        {truncateWallet(user.wallet_address)}
                                    </td>
                                    <td style={cellStyle}>
                                        <span style={getRoleBadgeStyle(currentRole)}>
                                            {currentRole}
                                        </span>
                                    </td>
                                    <td style={cellStyle}>{user.login_count}</td>
                                    <td style={cellStyle}>
                                        {user.streak ? (
                                            <span>
                                                {user.streak.current_streak} streak
                                                <span style={{ color: 'rgba(255,255,255,0.3)', marginLeft: '4px' }}>
                                                    (best: {user.streak.longest_streak})
                                                </span>
                                            </span>
                                        ) : '—'}
                                    </td>
                                    <td style={cellStyle}>{formatDate(user.created_at)}</td>
                                    <td style={{ ...cellStyle, textAlign: 'right' }}>
                                        <button
                                            onClick={() => setDeleteTarget({
                                                id: user.id,
                                                name: user.name || user.username || user.email || user.id,
                                            })}
                                            disabled={isLoading}
                                            style={{
                                                padding: '4px 10px',
                                                borderRadius: '5px',
                                                border: '1px solid rgba(248,113,113,0.2)',
                                                background: 'rgba(248,113,113,0.1)',
                                                color: '#f87171',
                                                cursor: 'pointer',
                                                fontSize: '11px',
                                            }}
                                            title="Delete user"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px 20px',
                    borderTop: '1px solid rgba(255,255,255,0.06)',
                }}
            >
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
                    {total.toLocaleString()} users total
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                        onClick={() => onPageChange(page - 1)}
                        disabled={page <= 1}
                        style={{
                            padding: '6px 12px',
                            borderRadius: '6px',
                            border: '1px solid rgba(255,255,255,0.1)',
                            background: 'rgba(255,255,255,0.04)',
                            color: page <= 1 ? 'rgba(255,255,255,0.2)' : '#fff',
                            cursor: page <= 1 ? 'not-allowed' : 'pointer',
                            fontSize: '12px',
                        }}
                    >
                        ← Previous
                    </button>
                    <span style={{ padding: '6px 12px', fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
                        Page {page} of {totalPages}
                    </span>
                    <button
                        onClick={() => onPageChange(page + 1)}
                        disabled={page >= totalPages}
                        style={{
                            padding: '6px 12px',
                            borderRadius: '6px',
                            border: '1px solid rgba(255,255,255,0.1)',
                            background: 'rgba(255,255,255,0.04)',
                            color: page >= totalPages ? 'rgba(255,255,255,0.2)' : '#fff',
                            cursor: page >= totalPages ? 'not-allowed' : 'pointer',
                            fontSize: '12px',
                        }}
                    >
                        Next →
                    </button>
                </div>
            </div>

            {/* Delete confirmation modal */}
            {deleteTarget && (
                <DeleteConfirmModal
                    userName={deleteTarget.name}
                    onConfirm={handleDelete}
                    onCancel={() => { setDeleteTarget(null); setErrorMsg(null); }}
                    isLoading={actionLoading === deleteTarget.id}
                />
            )}
        </div>
    );
}
