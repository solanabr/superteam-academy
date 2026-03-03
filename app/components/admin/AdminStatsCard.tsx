/**
 * Admin stats card — lightweight, no icons, no emojis.
 * Just title + value with optional change indicator.
 */

interface AdminStatsCardProps {
    title: string;
    value: string | number;
    change?: string;
    icon?: string;
}

export function AdminStatsCard({ title, value, change, icon }: AdminStatsCardProps) {
    const isPositive = change?.startsWith('+');

    return (
        <div
            style={{
                background: '#111122',
                border: '1px solid #1e1e30',
                borderRadius: '8px',
                padding: '16px 20px',
            }}
        >
            <div style={{ fontSize: '11px', color: '#666', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>
                {icon && <span style={{ marginRight: '6px' }}>{icon}</span>}{title}
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <span style={{ fontSize: '24px', fontWeight: 700, color: '#e0e0e0', letterSpacing: '-0.02em' }}>
                    {typeof value === 'number' ? value.toLocaleString() : value}
                </span>
                {change && (
                    <span
                        style={{
                            fontSize: '11px',
                            fontWeight: 600,
                            color: isPositive ? '#4ade80' : '#f87171',
                        }}
                    >
                        {change}
                    </span>
                )}
            </div>
        </div>
    );
}
