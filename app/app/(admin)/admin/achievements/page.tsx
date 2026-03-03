/**
 * Admin Achievements page — server component.
 *
 * Shows achievement award counts from Prisma achievements table.
 */

import { prisma } from '@/backend/prisma';

export default async function AdminAchievementsPage() {
    const [totalAwards, achievementGroups] = await Promise.all([
        prisma.achievements.count(),
        prisma.achievements.groupBy({
            by: ['achievement_id'],
            _count: { achievement_id: true },
            orderBy: { _count: { achievement_id: 'desc' } },
        }),
    ]);

    return (
        <div>
            <div style={{ marginBottom: '24px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 700, margin: '0 0 4px', letterSpacing: '-0.02em' }}>
                    Achievements
                </h1>
                <p style={{ margin: 0, fontSize: '14px', color: 'rgba(255,255,255,0.5)' }}>
                    {totalAwards} total awards across {achievementGroups.length} achievement types
                </p>
            </div>

            <div
                style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: '12px',
                    overflow: 'hidden',
                }}
            >
                <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 600 }}>Awards by Type</h2>
                </div>

                {achievementGroups.length > 0 ? (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr>
                                <th
                                    style={{
                                        padding: '10px 16px',
                                        fontSize: '11px',
                                        fontWeight: 600,
                                        color: 'rgba(255,255,255,0.4)',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.05em',
                                        textAlign: 'left',
                                        borderBottom: '1px solid rgba(255,255,255,0.04)',
                                    }}
                                >
                                    Achievement ID
                                </th>
                                <th
                                    style={{
                                        padding: '10px 16px',
                                        fontSize: '11px',
                                        fontWeight: 600,
                                        color: 'rgba(255,255,255,0.4)',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.05em',
                                        textAlign: 'left',
                                        borderBottom: '1px solid rgba(255,255,255,0.04)',
                                    }}
                                >
                                    Awards
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {achievementGroups.map((group) => (
                                <tr key={group.achievement_id}>
                                    <td
                                        style={{
                                            padding: '12px 16px',
                                            fontSize: '13px',
                                            fontFamily: 'var(--font-geist-mono)',
                                            color: '#fff',
                                            borderBottom: '1px solid rgba(255,255,255,0.04)',
                                        }}
                                    >
                                        {group.achievement_id}
                                    </td>
                                    <td
                                        style={{
                                            padding: '12px 16px',
                                            fontSize: '13px',
                                            color: 'rgba(255,255,255,0.7)',
                                            borderBottom: '1px solid rgba(255,255,255,0.04)',
                                        }}
                                    >
                                        {group._count.achievement_id}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div
                        style={{
                            padding: '40px',
                            textAlign: 'center',
                            color: 'rgba(255,255,255,0.3)',
                            fontSize: '13px',
                        }}
                    >
                        No achievements awarded yet
                    </div>
                )}
            </div>
        </div>
    );
}
