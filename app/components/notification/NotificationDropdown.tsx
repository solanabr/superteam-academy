/**
 * Notification Dropdown — shows notification list with actions.
 */

'use client';

import { useNotifications, type Notification } from '@/context/stores/notificationStore';

function formatRelativeTime(timestamp: number): string {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}

const TYPE_ICONS: Record<Notification['type'], string> = {
    lesson_complete: '📖',
    course_complete: '🎉',
    achievement_unlock: '🏆',
    credential_issued: '📜',
    streak_milestone: '🔥',
    daily_login_claim: '🎁',
    level_up: '⭐',
    reply: '💬',
    mention: '📣',
    system: '📢',
};

interface NotificationDropdownProps {
    notifications: Notification[];
    onClose: () => void;
}

export function NotificationDropdown({ notifications, onClose }: NotificationDropdownProps) {
    const { markAsRead, markAllAsRead } = useNotifications();

    return (
        <>
            {/* Mobile backdrop overlay */}
            <div
                className="notification-backdrop"
                onClick={onClose}
                style={{
                    display: 'none',
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0,0,0,0.4)',
                    zIndex: 99,
                }}
            />

            <style>{`
                @media (max-width: 640px) {
                    .notification-backdrop { display: block !important; }
                    .notification-panel {
                        position: fixed !important;
                        top: 3.5rem !important;
                        left: 0.75rem !important;
                        right: 0.75rem !important;
                        width: auto !important;
                        max-width: none !important;
                        max-height: calc(100dvh - 4.5rem) !important;
                        margin-top: 0 !important;
                    }
                }
            `}</style>

            <div
                className="notification-panel"
                style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: '0.5rem',
                    width: '360px',
                    maxWidth: 'calc(100vw - 2rem)',
                    maxHeight: '480px',
                    background: 'var(--card)',
                    borderRadius: '1rem',
                    border: '1px solid var(--border)',
                    boxShadow: '0 16px 64px rgba(0,0,0,0.3)',
                    backdropFilter: 'blur(16px)',
                    overflow: 'hidden',
                    zIndex: 100,
                    display: 'flex',
                    flexDirection: 'column' as const,
                    color: 'var(--card-foreground)',
                }}
            >
                {/* Header */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '1rem 1.25rem',
                        borderBottom: '1px solid var(--border)',
                    }}
                >
                    <h3 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 600, color: 'var(--card-foreground)' }}>
                        Notifications
                    </h3>
                    <button
                        onClick={markAllAsRead}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--accent)',
                            cursor: 'pointer',
                            fontSize: '0.8125rem',
                            fontWeight: 500,
                            padding: '0.25rem 0.5rem',
                            borderRadius: '0.375rem',
                            transition: 'background 0.2s',
                        }}
                        onMouseOver={(e) => {
                            (e.currentTarget as HTMLElement).style.background = 'var(--muted)';
                        }}
                        onMouseOut={(e) => {
                            (e.currentTarget as HTMLElement).style.background = 'none';
                        }}
                    >
                        Mark all read
                    </button>
                </div>

                {/* Notification List */}
                <div
                    style={{
                        overflowY: 'auto',
                        flex: 1,
                        maxHeight: '380px',
                    }}
                >
                    {notifications.length === 0 ? (
                        <div
                            style={{
                                padding: '2.5rem 1.25rem',
                                textAlign: 'center',
                                color: 'var(--muted-foreground)',
                            }}
                        >
                            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔔</div>
                            <p style={{ margin: 0, fontSize: '0.875rem' }}>No notifications yet</p>
                        </div>
                    ) : (
                        notifications.map((notif) => (
                            <button
                                key={notif.id}
                                onClick={() => markAsRead(notif.id)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: '0.75rem',
                                    padding: '0.875rem 1.25rem',
                                    background: notif.read ? 'transparent' : 'var(--muted)',
                                    borderBottom: '1px solid var(--border)',
                                    cursor: 'pointer',
                                    width: '100%',
                                    textAlign: 'left',
                                    border: 'none',
                                    borderBlockEnd: '1px solid var(--border)',
                                    color: 'var(--card-foreground)',
                                    transition: 'background 0.2s',
                                }}
                                onMouseOver={(e) => {
                                    (e.currentTarget as HTMLElement).style.background = 'var(--muted)';
                                }}
                                onMouseOut={(e) => {
                                    (e.currentTarget as HTMLElement).style.background = notif.read
                                        ? 'transparent'
                                        : 'var(--muted)';
                                }}
                            >
                                <span style={{ fontSize: '1.375rem', flexShrink: 0, marginTop: '0.125rem' }}>
                                    {TYPE_ICONS[notif.type] || '📌'}
                                </span>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div
                                        style={{
                                            fontWeight: notif.read ? 400 : 600,
                                            fontSize: '0.8125rem',
                                            marginBottom: '0.125rem',
                                        }}
                                    >
                                        {notif.title}
                                    </div>
                                    <div
                                        style={{
                                            color: 'var(--muted-foreground)',
                                            fontSize: '0.75rem',
                                            lineHeight: 1.4,
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                        }}
                                    >
                                        {notif.message}
                                    </div>
                                    <div
                                        style={{
                                            color: 'var(--muted-foreground)',
                                            fontSize: '0.6875rem',
                                            marginTop: '0.25rem',
                                            opacity: 0.7,
                                        }}
                                    >
                                        {formatRelativeTime(notif.createdAt)}
                                    </div>
                                </div>
                                {!notif.read && (
                                    <span
                                        style={{
                                            width: '0.5rem',
                                            height: '0.5rem',
                                            borderRadius: '50%',
                                            background: 'var(--accent)',
                                            flexShrink: 0,
                                            marginTop: '0.375rem',
                                        }}
                                    />
                                )}
                            </button>
                        ))
                    )}
                </div>
            </div>
        </>
    );
}
