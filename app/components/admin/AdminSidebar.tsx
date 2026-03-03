'use client';

/**
 * Admin sidebar navigation — lightweight, no emojis, no external icons.
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
    { href: '/admin', label: 'Dashboard' },
    { href: '/admin/users', label: 'Users' },
    { href: '/admin/courses', label: 'Courses' },
    { href: '/admin/studio', label: 'Studio' },
    { href: '/admin/achievements', label: 'Achievements' },
    { href: '/admin/config', label: 'Config' },
];

export function AdminSidebar() {
    const pathname = usePathname();
    const stripped = pathname?.replace(/^\/[a-z]{2}(-[A-Z]{2})?/, '') || '/';

    return (
        <aside
            style={{
                width: '220px',
                flexShrink: 0,
                height: '100%',
                overflowY: 'auto',
                background: '#0d0d1a',
                borderRight: '1px solid #1e1e30',
                padding: '20px 0',
                display: 'flex',
                flexDirection: 'column',
                fontFamily: 'system-ui, -apple-system, sans-serif',
            }}
        >
            {/* Scoped hover styles */}
            <style>{`
                .admin-nav-link {
                    display: block;
                    padding: 8px 12px;
                    border-radius: 6px;
                    text-decoration: none;
                    font-size: 13px;
                    border-left: 2px solid transparent;
                    transition: all 0.15s ease;
                }
                .admin-nav-link:not(.active):hover {
                    color: #bbb !important;
                    background: rgba(255,255,255,0.03);
                    border-left-color: rgba(99,102,241,0.3);
                }
                .admin-nav-link.active {
                    font-weight: 600;
                    color: #fff;
                    background: #1a1a30;
                    border-left-color: #6366f1;
                }
                .admin-back-link {
                    display: block;
                    padding: 8px 12px;
                    border-radius: 6px;
                    text-decoration: none;
                    font-size: 12px;
                    color: #666;
                    transition: color 0.15s ease;
                }
                .admin-back-link:hover {
                    color: #aaa;
                }
            `}</style>

            {/* Header */}
            <div style={{ padding: '0 16px 16px', borderBottom: '1px solid #1e1e30', marginBottom: '8px' }}>
                <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#e0e0e0', letterSpacing: '-0.01em' }}>
                    Admin Panel
                </h2>
                <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#555' }}>
                    Superteam Academy
                </p>
            </div>

            {/* Nav links */}
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '1px', padding: '0 8px', flex: 1 }}>
                {navItems.map((item) => {
                    const isActive =
                        item.href === '/admin'
                            ? stripped === '/admin' || stripped === '/admin/'
                            : stripped?.startsWith(item.href);

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`admin-nav-link${isActive ? ' active' : ''}`}
                            style={{
                                fontWeight: isActive ? 600 : 400,
                                color: isActive ? '#fff' : '#888',
                            }}
                        >
                            {item.label}
                        </Link>
                    );
                })}
            </nav>

            {/* Back to dashboard */}
            <div style={{ padding: '12px 8px', borderTop: '1px solid #1e1e30' }}>
                <Link href="/dashboard" className="admin-back-link">
                    ← Back to Dashboard
                </Link>
            </div>
        </aside>
    );
}
