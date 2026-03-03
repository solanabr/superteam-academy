/**
 * XP Balance card component.
 *
 * Displays XP amount with a lightning bolt icon and optional rank.
 * Uses glassmorphism styling matching the existing design system.
 */
'use client';

interface XpBalanceCardProps {
    balance: number;
    level: number;
    rank?: number;
}

import { useTranslations } from 'next-intl';

export function XpBalanceCard({ balance, level, rank }: XpBalanceCardProps) {
    const t = useTranslations('xp');
    return (
        <div className="xp-balance-card" id="xp-balance-card">
            <div className="xp-header">
                <div className="xp-icon">⚡</div>
                <div className="xp-label">{t('title')}</div>
            </div>

            <div className="xp-amount">
                <span className="xp-value">{balance.toLocaleString()}</span>
                <span className="xp-unit">XP</span>
            </div>

            <div className="xp-meta">
                <div className="level-pill">
                    <span className="level-icon">🏆</span>
                    {t('level', { level })}
                </div>
                {rank && (
                    <div className="rank-pill">
                        <span className="rank-icon">📊</span>
                        {t('rank', { rank })}
                    </div>
                )}
            </div>

            <style jsx>{`
                .xp-balance-card {
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                    padding: 24px;
                    border-radius: 16px;
                    background: linear-gradient(135deg, rgba(255, 215, 0, 0.08) 0%, rgba(255, 170, 0, 0.04) 100%);
                    border: 1px solid rgba(255, 215, 0, 0.15);
                    position: relative;
                    overflow: hidden;
                }
                .xp-balance-card::before {
                    content: '';
                    position: absolute;
                    top: -50%;
                    right: -50%;
                    width: 100%;
                    height: 100%;
                    background: radial-gradient(circle, rgba(255, 215, 0, 0.06) 0%, transparent 70%);
                    pointer-events: none;
                }
                .xp-header {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                .xp-icon {
                    font-size: 1.25rem;
                }
                .xp-label {
                    font-size: 0.75rem;
                    text-transform: uppercase;
                    letter-spacing: 0.08em;
                    color: rgba(255, 215, 0, 0.6);
                    font-weight: 600;
                }
                .xp-amount {
                    display: flex;
                    align-items: baseline;
                    gap: 6px;
                }
                .xp-value {
                    font-size: 2.5rem;
                    font-weight: 800;
                    background: linear-gradient(135deg, #ffd700, #ffaa00);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    line-height: 1;
                }
                .xp-unit {
                    font-size: 1rem;
                    font-weight: 600;
                    color: rgba(255, 215, 0, 0.5);
                }
                .xp-meta {
                    display: flex;
                    gap: 8px;
                }
                .level-pill, .rank-pill {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    font-size: 0.75rem;
                    font-weight: 600;
                    padding: 4px 12px;
                    border-radius: 20px;
                    background: rgba(255, 255, 255, 0.06);
                    color: rgba(255, 255, 255, 0.6);
                }
                .level-icon, .rank-icon {
                    font-size: 0.8rem;
                }
            `}</style>
        </div>
    );
}
