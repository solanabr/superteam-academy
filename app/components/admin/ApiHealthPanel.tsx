/**
 * API Health Panel — polls /api/health, shows service status + latency.
 * Displays error codes and endpoint details for failed checks.
 * Auto-refreshes every 30 seconds. Zero dependencies, inline styles only.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';

interface ServiceCheck {
    ok: boolean;
    latencyMs?: number;
    error?: string;
    errorCode?: string;
    endpoint?: string;
}

interface HealthData {
    status: 'healthy' | 'degraded';
    timestamp: string;
    checks: Record<string, ServiceCheck>;
}

export function ApiHealthPanel() {
    const [health, setHealth] = useState<HealthData | null>(null);
    const [loading, setLoading] = useState(true);
    const [lastChecked, setLastChecked] = useState<string>('');

    const fetchHealth = useCallback(async () => {
        try {
            const res = await fetch('/api/health');
            const data = await res.json();
            setHealth(data);
            setLastChecked(new Date().toLocaleTimeString());
        } catch {
            setHealth(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchHealth();
        const interval = setInterval(fetchHealth, 30000);
        return () => clearInterval(interval);
    }, [fetchHealth]);

    const card: React.CSSProperties = { background: '#111122', border: '1px solid #1e1e30', borderRadius: '8px', overflow: 'hidden' };
    const cell: React.CSSProperties = { padding: '10px 16px', fontSize: '13px', color: '#bbb', borderBottom: '1px solid #1a1a28', verticalAlign: 'top' };
    const header: React.CSSProperties = { ...cell, fontSize: '11px', fontWeight: 600, color: '#555', textTransform: 'uppercase', letterSpacing: '0.04em' };

    const services = health ? Object.entries(health.checks) : [];

    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#e0e0e0' }}>API Health</h2>
                    <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#555' }}>
                        {lastChecked ? `Last checked: ${lastChecked}` : 'Checking...'}
                        {' · Auto-refreshes every 30s'}
                    </p>
                </div>
                {health && (
                    <span
                        style={{
                            padding: '4px 10px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 600,
                            color: health.status === 'healthy' ? '#4ade80' : '#f87171',
                            background: health.status === 'healthy' ? '#0a1a0a' : '#1a0a0a',
                            border: `1px solid ${health.status === 'healthy' ? '#1a3a1a' : '#3a1a1a'}`,
                        }}
                    >
                        {health.status.toUpperCase()}
                    </span>
                )}
            </div>

            <div style={card}>
                <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                    <colgroup>
                        <col style={{ width: '18%' }} />
                        <col style={{ width: '12%' }} />
                        <col style={{ width: '15%' }} />
                        <col style={{ width: '55%' }} />
                    </colgroup>
                    <thead>
                        <tr>
                            <th style={{ ...header, textAlign: 'left' }}>Service</th>
                            <th style={{ ...header, textAlign: 'left' }}>Status</th>
                            <th style={{ ...header, textAlign: 'left' }}>Latency</th>
                            <th style={{ ...header, textAlign: 'left' }}>Details</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={4} style={{ ...cell, textAlign: 'center', color: '#555' }}>Checking endpoints...</td></tr>
                        ) : !health ? (
                            <tr><td colSpan={4} style={{ ...cell, textAlign: 'center', color: '#f87171' }}>Failed to reach /api/health</td></tr>
                        ) : services.length === 0 ? (
                            <tr><td colSpan={4} style={{ ...cell, textAlign: 'center', color: '#555' }}>No services configured</td></tr>
                        ) : (
                            services.map(([name, check]) => (
                                <tr key={name}>
                                    <td style={{ ...cell, fontWeight: 500, color: '#ccc' }}>
                                        <div>
                                            <span style={{ textTransform: 'capitalize' }}>
                                                {name.replace(/_/g, ' ')}
                                            </span>
                                            {check.endpoint && (
                                                <div style={{
                                                    fontSize: '10px',
                                                    color: '#555',
                                                    fontFamily: 'monospace',
                                                    marginTop: '2px',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                }}>
                                                    {check.endpoint}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td style={cell}>
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                            <span
                                                style={{
                                                    width: '8px',
                                                    height: '8px',
                                                    borderRadius: '50%',
                                                    background: check.ok ? '#4ade80' : '#f87171',
                                                    display: 'inline-block',
                                                }}
                                            />
                                            <span style={{ color: check.ok ? '#4ade80' : '#f87171', fontSize: '12px', fontWeight: 600 }}>
                                                {check.ok ? 'UP' : 'DOWN'}
                                            </span>
                                        </span>
                                    </td>
                                    <td style={{ ...cell, fontFamily: 'monospace', fontSize: '12px' }}>
                                        {check.latencyMs != null ? `${check.latencyMs}ms` : '—'}
                                    </td>
                                    <td style={{ ...cell, fontSize: '12px' }}>
                                        {check.ok ? (
                                            <span style={{ color: '#555' }}>OK</span>
                                        ) : (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                                {check.errorCode && (
                                                    <span style={{
                                                        display: 'inline-block',
                                                        padding: '1px 6px',
                                                        borderRadius: '3px',
                                                        fontSize: '10px',
                                                        fontWeight: 600,
                                                        fontFamily: 'monospace',
                                                        background: 'rgba(248,113,113,0.1)',
                                                        color: '#f87171',
                                                        border: '1px solid rgba(248,113,113,0.2)',
                                                        width: 'fit-content',
                                                    }}>
                                                        {check.errorCode}
                                                    </span>
                                                )}
                                                {check.error && (
                                                    <span style={{ color: '#f87171', fontSize: '11px', lineHeight: '1.3' }}>
                                                        {check.error}
                                                    </span>
                                                )}
                                            </div>
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
