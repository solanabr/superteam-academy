/**
 * Admin Config page — server component.
 *
 * Display-only platform configuration overview.
 * Shows program addresses, network, and feature status.
 */

import { PROGRAM_ID, XP_MINT } from '@/context/solana/constants';

export default function AdminConfigPage() {
    const network = process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet';
    const adminWallets = (process.env.ADMIN_WALLETS || '').split(',').map(w => w.trim()).filter(Boolean);
    const sanityProjectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'Not configured';

    const configItems = [
        {
            section: 'Program',
            items: [
                { label: 'Program ID', value: PROGRAM_ID.toBase58(), mono: true },
                { label: 'XP Mint', value: XP_MINT.toBase58(), mono: true },
                { label: 'Network', value: network.toUpperCase() },
            ],
        },
        {
            section: 'Admin Access',
            items: [
                { label: 'Admin Source', value: 'DB Whitelist (primary) + Env (emergency)' },
                ...adminWallets.map((w, i) => ({
                    label: `Env Wallet ${i + 1}`,
                    value: w,
                    mono: true,
                })),
            ],
        },
        {
            section: 'External Services',
            items: [
                { label: 'Sanity CMS', value: sanityProjectId },
                { label: 'Analytics (GA4)', value: process.env.NEXT_PUBLIC_GA_ID ? 'Configured' : 'Not configured' },
                { label: 'Analytics (PostHog)', value: process.env.NEXT_PUBLIC_POSTHOG_KEY ? 'Configured' : 'Not configured' },
                { label: 'Error Monitoring (Sentry)', value: process.env.SENTRY_DSN ? 'Configured' : 'Not configured' },
            ],
        },
    ];

    return (
        <div>
            <div style={{ marginBottom: '24px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 700, margin: '0 0 4px', letterSpacing: '-0.02em' }}>
                    Configuration
                </h1>
                <p style={{ margin: 0, fontSize: '14px', color: 'rgba(255,255,255,0.5)' }}>
                    Platform settings and service status
                </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {configItems.map((section) => (
                    <div
                        key={section.section}
                        style={{
                            background: 'rgba(255,255,255,0.02)',
                            border: '1px solid rgba(255,255,255,0.06)',
                            borderRadius: '12px',
                            overflow: 'hidden',
                        }}
                    >
                        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                            <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 600 }}>{section.section}</h2>
                        </div>
                        <div>
                            {section.items.map((item) => (
                                <div
                                    key={item.label}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '12px 20px',
                                        borderBottom: '1px solid rgba(255,255,255,0.03)',
                                    }}
                                >
                                    <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>
                                        {item.label}
                                    </span>
                                    <span
                                        style={{
                                            fontSize: '13px',
                                            color: '#fff',
                                            fontFamily: (item as { mono?: boolean }).mono
                                                ? 'var(--font-geist-mono)'
                                                : 'inherit',
                                        }}
                                    >
                                        {item.value}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
