/**
 * Admin Users page — client component.
 *
 * Fetches paginated user data from /api/admin/users and renders UserTable.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { UserTable } from '@/components/admin/UserTable';
import { ADMIN_PAGE_SIZE } from '@/backend/admin/utils';

interface UsersResponse {
    users: Array<{
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
    }>;
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

export default function AdminUsersPage() {
    const [data, setData] = useState<UsersResponse | null>(null);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: String(page), limit: String(ADMIN_PAGE_SIZE) });
            if (search) params.set('search', search);

            const res = await fetch(`/api/admin/users?${params}`);
            if (res.ok) {
                const json = await res.json();
                setData(json);
            }
        } finally {
            setLoading(false);
        }
    }, [page, search]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    // Debounced search
    const [searchInput, setSearchInput] = useState('');
    useEffect(() => {
        const timer = setTimeout(() => {
            setSearch(searchInput);
            setPage(1);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchInput]);

    return (
        <div>
            <div style={{ marginBottom: '24px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 700, margin: '0 0 4px', letterSpacing: '-0.02em' }}>
                    Users
                </h1>
                <p style={{ margin: 0, fontSize: '14px', color: 'rgba(255,255,255,0.5)' }}>
                    Manage platform users
                </p>
            </div>

            {/* Search */}
            <div style={{ marginBottom: '16px' }}>
                <input
                    type="search"
                    placeholder="Search by name, email, wallet, or username…"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    style={{
                        width: '100%',
                        maxWidth: '400px',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: '1px solid rgba(255,255,255,0.1)',
                        background: 'rgba(255,255,255,0.04)',
                        color: '#fff',
                        fontSize: '13px',
                        outline: 'none',
                    }}
                />
            </div>

            {/* Table */}
            <div
                style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    opacity: loading ? 0.6 : 1,
                    transition: 'opacity 0.2s',
                }}
            >
                {data ? (
                    <UserTable
                        users={data.users}
                        page={data.page}
                        totalPages={data.totalPages}
                        total={data.total}
                        onPageChange={setPage}
                        onRefresh={fetchUsers}
                    />
                ) : (
                    <div style={{ padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
                        {loading ? 'Loading users…' : 'No users found'}
                    </div>
                )}
            </div>
        </div>
    );
}
