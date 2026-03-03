/**
 * Activity feed — audit log entries with colored dot indicators instead of emojis.
 */

interface AuditEntry {
    id: string;
    action: string;
    user_id: string;
    ip_address: string | null;
    created_at: string;
}

interface ActivityFeedProps {
    entries: AuditEntry[];
}

const ACTION_META: Record<string, { label: string; color: string }> = {
    wallet_login: { label: 'Wallet login', color: '#6366f1' },
    wallet_signup: { label: 'New wallet signup', color: '#22c55e' },
    google_login: { label: 'Google login', color: '#3b82f6' },
    google_signup: { label: 'New Google signup', color: '#22c55e' },
    github_login: { label: 'GitHub login', color: '#8b5cf6' },
    github_signup: { label: 'New GitHub signup', color: '#22c55e' },
    account_deleted: { label: 'Account deleted', color: '#ef4444' },
    account_linked: { label: 'Account linked', color: '#06b6d4' },
    account_unlinked: { label: 'Account unlinked', color: '#f59e0b' },
    admin_user_hard_delete: { label: 'User hard deleted', color: '#ef4444' },
    admin_role_change: { label: 'Role changed', color: '#f59e0b' },
};

function formatTimeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}

export function ActivityFeed({ entries }: ActivityFeedProps) {
    if (entries.length === 0) {
        return (
            <p style={{ color: '#555', fontSize: '13px', textAlign: 'center', padding: '24px' }}>
                No recent activity
            </p>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
            {entries.map((entry) => {
                const meta = ACTION_META[entry.action] || { label: entry.action, color: '#555' };
                return (
                    <div
                        key={entry.id}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '10px 16px',
                            borderBottom: '1px solid #1a1a28',
                        }}
                    >
                        {/* Colored dot */}
                        <span
                            style={{
                                width: '7px',
                                height: '7px',
                                borderRadius: '50%',
                                background: meta.color,
                                flexShrink: 0,
                            }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <span style={{ fontSize: '13px', color: '#ccc' }}>{meta.label}</span>
                            <span
                                style={{
                                    fontSize: '11px',
                                    color: '#444',
                                    marginLeft: '8px',
                                    fontFamily: 'monospace',
                                }}
                            >
                                {entry.user_id.slice(0, 8)}
                            </span>
                        </div>
                        <span style={{ fontSize: '11px', color: '#444', flexShrink: 0 }}>
                            {formatTimeAgo(entry.created_at)}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}
