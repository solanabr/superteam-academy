/**
 * Admin Whitelist Panel — no emojis, no confirm(), inline styles only.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';

interface WhitelistEntry {
    id: string;
    email: string | null;
    wallet: string | null;
    added_at: string;
    adder: { name: string | null; email: string | null } | null;
}

export function WhitelistPanel() {
    const [entries, setEntries] = useState<WhitelistEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [adding, setAdding] = useState(false);
    const [removingId, setRemovingId] = useState<string | null>(null);
    const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [formEmail, setFormEmail] = useState('');
    const [formWallet, setFormWallet] = useState('');
    const [error, setError] = useState<string | null>(null);

    const fetchEntries = useCallback(async () => {
        try {
            const res = await fetch('/api/admin/whitelist');
            if (res.ok) setEntries(await res.json());
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchEntries(); }, [fetchEntries]);

    const handleAdd = async () => {
        const email = formEmail.trim().toLowerCase() || null;
        const wallet = formWallet.trim() || null;
        if (!email && !wallet) {
            setError('Provide an email or wallet address');
            return;
        }
        setAdding(true);
        setError(null);
        try {
            const res = await fetch('/api/admin/whitelist', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, wallet }),
            });
            if (!res.ok) {
                const data = await res.json();
                setError(data.error || 'Failed to add');
                return;
            }
            setFormEmail('');
            setFormWallet('');
            setShowForm(false);
            await fetchEntries();
        } finally {
            setAdding(false);
        }
    };

    const handleRemove = async (id: string) => {
        setRemovingId(id);
        try {
            const res = await fetch(`/api/admin/whitelist/${id}`, {
                method: 'DELETE',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({ error: 'Failed' }));
                setError(data.error || 'Failed to remove');
                return;
            }
            setConfirmRemoveId(null);
            await fetchEntries();
        } finally {
            setRemovingId(null);
        }
    };

    const card: React.CSSProperties = { background: '#111122', border: '1px solid #1e1e30', borderRadius: '8px', overflow: 'hidden' };
    const cell: React.CSSProperties = { padding: '10px 16px', fontSize: '13px', color: '#bbb', borderBottom: '1px solid #1a1a28' };
    const header: React.CSSProperties = { ...cell, fontSize: '11px', fontWeight: 600, color: '#555', textTransform: 'uppercase', letterSpacing: '0.04em' };
    const btn: React.CSSProperties = { padding: '6px 12px', borderRadius: '6px', border: '1px solid #2a2a3a', background: '#1a1a2a', color: '#ccc', cursor: 'pointer', fontSize: '12px' };
    const input: React.CSSProperties = { padding: '8px 12px', borderRadius: '6px', border: '1px solid #2a2a3a', background: '#0d0d1a', color: '#ccc', fontSize: '13px', outline: 'none', width: '100%', boxSizing: 'border-box' };

    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#e0e0e0' }}>Admin Whitelist</h2>
                    <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#555' }}>Manage admin access</p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    style={{ ...btn, background: showForm ? '#2a1a1a' : '#1a1a30', border: showForm ? '1px solid #3a2020' : '1px solid #2a2a50' }}
                >
                    {showForm ? 'Cancel' : '+ Add Admin'}
                </button>
            </div>

            {showForm && (
                <div style={{ ...card, padding: '16px', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', fontSize: '11px', color: '#555', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Email</label>
                            <input type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} placeholder="admin@example.com" style={input} />
                        </div>
                        <div style={{ fontSize: '12px', color: '#444', padding: '8px 0' }}>or</div>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', fontSize: '11px', color: '#555', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Wallet</label>
                            <input type="text" value={formWallet} onChange={(e) => setFormWallet(e.target.value)} placeholder="Solana wallet address" style={input} />
                        </div>
                        <button onClick={handleAdd} disabled={adding} style={{ ...btn, background: '#1a2a1a', border: '1px solid #2a3a2a', opacity: adding ? 0.5 : 1 }}>
                            {adding ? 'Adding...' : 'Add'}
                        </button>
                    </div>
                    {error && <p style={{ margin: '8px 0 0', fontSize: '12px', color: '#f87171' }}>{error}</p>}
                </div>
            )}

            <div style={card}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr>
                            <th style={header}>Email / Wallet</th>
                            <th style={header}>Added By</th>
                            <th style={header}>Added</th>
                            <th style={{ ...header, textAlign: 'right' }}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={4} style={{ ...cell, textAlign: 'center', color: '#555' }}>Loading...</td></tr>
                        ) : entries.length === 0 ? (
                            <tr><td colSpan={4} style={{ ...cell, textAlign: 'center', color: '#555' }}>No entries</td></tr>
                        ) : (
                            entries.map((entry) => (
                                <tr key={entry.id}>
                                    <td style={cell}>
                                        {entry.email && <div style={{ fontWeight: 500 }}>{entry.email}</div>}
                                        {entry.wallet && (
                                            <div style={{ fontFamily: 'monospace', fontSize: '12px', color: '#666' }}>
                                                {entry.wallet.slice(0, 6)}...{entry.wallet.slice(-4)}
                                            </div>
                                        )}
                                    </td>
                                    <td style={cell}>{entry.adder?.name || entry.adder?.email || '—'}</td>
                                    <td style={cell}>
                                        {new Date(entry.added_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </td>
                                    <td style={{ ...cell, textAlign: 'right' }}>
                                        {confirmRemoveId === entry.id ? (
                                            <span style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                                                <span style={{ fontSize: '11px', color: '#f87171' }}>Confirm?</span>
                                                <button
                                                    onClick={() => handleRemove(entry.id)}
                                                    disabled={removingId === entry.id}
                                                    style={{ ...btn, background: '#2a1515', border: '1px solid #4a2020', color: '#f87171', fontSize: '11px' }}
                                                >
                                                    {removingId === entry.id ? 'Removing...' : 'Yes, remove'}
                                                </button>
                                                <button
                                                    onClick={() => setConfirmRemoveId(null)}
                                                    style={{ ...btn, fontSize: '11px' }}
                                                >
                                                    No
                                                </button>
                                            </span>
                                        ) : (
                                            <button
                                                onClick={() => setConfirmRemoveId(entry.id)}
                                                style={{ ...btn, background: '#1a1520', border: '1px solid #2a2030', color: '#f87171' }}
                                            >
                                                Remove
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
