/**
 * StreakDisplay — full streak widget with counter, stats, calendar, milestones.
 */
'use client';

import { useStreak } from '@/context/hooks/useStreak';
import { useTranslations } from 'next-intl';
import { StreakCalendar } from './StreakCalendar';

export function StreakDisplay() {
    const t = useTranslations('streak');
    const {
        streak,
        activity,
        milestones,
        isLoading,
        claimMilestone,
    } = useStreak();

    if (isLoading) {
        return (
            <div className="streak-skeleton">
                <div className="skeleton-bar wide" />
                <div className="skeleton-bar narrow" />
                <style jsx>{`
                    .streak-skeleton {
                        padding: 24px;
                        background: rgba(255, 255, 255, 0.03);
                        border: 1px solid rgba(255, 255, 255, 0.08);
                        border-radius: 16px;
                        display: flex;
                        flex-direction: column;
                        gap: 12px;
                    }
                    .skeleton-bar {
                        height: 20px;
                        border-radius: 6px;
                        background: rgba(255, 255, 255, 0.06);
                        animation: pulse 1.5s ease-in-out infinite;
                    }
                    .wide { width: 80%; }
                    .narrow { width: 50%; }
                    @keyframes pulse {
                        0%, 100% { opacity: 0.4; }
                        50% { opacity: 0.8; }
                    }
                `}</style>
            </div>
        );
    }

    if (!streak) return null;

    const flameSize = streak.currentStreak >= 100
        ? 'flame-xl'
        : streak.currentStreak >= 30
            ? 'flame-lg'
            : streak.currentStreak >= 7
                ? 'flame-md'
                : 'flame-sm';

    return (
        <div className="streak-display">
            {/* Header */}
            <div className="streak-header">
                <div className="streak-counter">
                    <span className={`flame ${flameSize}`}>🔥</span>
                    <span className="streak-count">{streak.currentStreak}</span>
                    <span className="streak-label">
                        {t('current', { count: streak.currentStreak })}
                    </span>
                </div>

                <div className="streak-stats">
                    <div className="stat">
                        <span className="stat-value">{streak.longestStreak}</span>
                        <span className="stat-label">{t('longest')}</span>
                    </div>
                    <div className="stat">
                        <span className="stat-value">
                            {streak.freezeCount}/{streak.maxFreezes}
                        </span>
                        <span className="stat-label">{t('freezes')}</span>
                    </div>
                </div>
            </div>

            {/* Calendar */}
            <StreakCalendar activity={activity} />

            {/* Milestones */}
            {milestones.length > 0 && (
                <div className="milestones-section">
                    <h4 className="milestones-title">{t('milestones')}</h4>
                    <div className="milestone-list">
                        {milestones.map((m) => {
                            const reached = streak.currentStreak >= m.days;
                            const canClaim = reached && !m.claimed;

                            return (
                                <div
                                    key={m.days}
                                    className={`milestone ${m.claimed ? 'claimed' : ''} ${reached ? 'reached' : ''}`}
                                >
                                    <div className="milestone-info">
                                        <span className="milestone-icon">
                                            {m.claimed ? '✅' : reached ? '🏆' : '🔒'}
                                        </span>
                                        <span className="milestone-days">{m.days} {t('days')}</span>
                                    </div>
                                    <span className="milestone-reward">
                                        +{m.xpReward.toLocaleString()} XP
                                    </span>
                                    {canClaim && (
                                        <button
                                            className="claim-btn"
                                            onClick={() => {
                                                // Get wallet from linked accounts / session
                                                const walletEl = document.querySelector<HTMLElement>('[data-wallet-address]');
                                                const wallet = walletEl?.dataset.walletAddress;
                                                if (!wallet) {
                                                    // Trigger wallet connection prompt
                                                    const event = new CustomEvent('connect-wallet', { detail: { reason: 'claim-milestone' } });
                                                    window.dispatchEvent(event);
                                                    return;
                                                }
                                                claimMilestone.mutate({ days: m.days, learnerWallet: wallet });
                                            }}
                                            disabled={claimMilestone.isPending}
                                            type="button"
                                        >
                                            {claimMilestone.isPending ? t('claiming') : '🔗 Claim On-Chain'}
                                        </button>
                                    )}
                                    {m.claimed && m.txSignature && (
                                        <a
                                            href={`https://explorer.solana.com/tx/${m.txSignature}?cluster=devnet`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="tx-link"
                                            title="View on Solana Explorer"
                                        >
                                            ↗
                                        </a>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            <style jsx>{`
                .streak-display {
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 16px;
                    padding: 24px;
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                }
                .streak-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }
                .streak-counter {
                    display: flex;
                    align-items: baseline;
                    gap: 8px;
                }
                .flame {
                    transition: transform 0.3s;
                }
                .flame-sm { font-size: 1.2rem; }
                .flame-md { font-size: 1.5rem; }
                .flame-lg { font-size: 1.8rem; }
                .flame-xl { font-size: 2.2rem; }
                .streak-count {
                    font-size: 2rem;
                    font-weight: 800;
                    color: rgba(255, 255, 255, 0.95);
                    line-height: 1;
                }
                .streak-label {
                    font-size: 0.85rem;
                    color: rgba(255, 255, 255, 0.4);
                    font-weight: 500;
                }
                .streak-stats {
                    display: flex;
                    gap: 16px;
                }
                .stat {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 2px;
                }
                .stat-value {
                    font-size: 0.9rem;
                    font-weight: 700;
                    color: rgba(255, 255, 255, 0.8);
                }
                .stat-label {
                    font-size: 0.65rem;
                    color: rgba(255, 255, 255, 0.35);
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                .milestones-section {
                    border-top: 1px solid rgba(255, 255, 255, 0.06);
                    padding-top: 16px;
                }
                .milestones-title {
                    font-size: 0.8rem;
                    font-weight: 700;
                    color: rgba(255, 255, 255, 0.6);
                    margin: 0 0 12px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                .milestone-list {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }
                .milestone {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 8px 12px;
                    border-radius: 8px;
                    background: rgba(255, 255, 255, 0.02);
                    border: 1px solid rgba(255, 255, 255, 0.04);
                    transition: all 0.15s;
                }
                .milestone.reached {
                    border-color: rgba(255, 215, 0, 0.2);
                    background: rgba(255, 215, 0, 0.04);
                }
                .milestone.claimed {
                    opacity: 0.5;
                }
                .milestone-info {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    flex: 1;
                }
                .milestone-icon {
                    font-size: 0.9rem;
                }
                .milestone-days {
                    font-size: 0.8rem;
                    font-weight: 600;
                    color: rgba(255, 255, 255, 0.7);
                }
                .milestone-reward {
                    font-size: 0.75rem;
                    font-weight: 600;
                    color: rgba(255, 215, 0, 0.7);
                }
                .claim-btn {
                    padding: 4px 12px;
                    border: none;
                    border-radius: 6px;
                    background: linear-gradient(135deg, #9945FF, #14F195);
                    color: white;
                    font-size: 0.72rem;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.15s;
                }
                .claim-btn:hover:not(:disabled) {
                    transform: translateY(-1px);
                }
                .claim-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
            `}</style>
        </div>
    );
}
