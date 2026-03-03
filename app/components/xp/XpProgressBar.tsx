/**
 * XP progress bar component.
 *
 * Displays current level with an animated progress bar
 * towards the next level threshold.
 */
'use client';

interface XpProgressBarProps {
    currentXp: number;
    nextLevelXp: number;
    level: number;
    levelProgress: number;
}

import { useTranslations } from 'next-intl';

export function XpProgressBar({
    currentXp,
    nextLevelXp,
    level,
    levelProgress,
}: XpProgressBarProps) {
    const t = useTranslations('xp');
    const isMaxLevel = nextLevelXp === Infinity;

    return (
        <div className="xp-progress" id="xp-progress-bar">
            <div className="progress-header">
                <div className="level-badge">
                    {t('level', { level })}
                </div>
                {!isMaxLevel && (
                    <div className="progress-label">
                        {t('progress', { current: currentXp.toLocaleString(), next: nextLevelXp.toLocaleString() })}
                    </div>
                )}
                {isMaxLevel && (
                    <div className="progress-label max-level">
                        {t('maxLevel')}
                    </div>
                )}
            </div>

            <div className="bar-container">
                <div
                    className="bar-fill"
                    style={{ width: `${Math.min(levelProgress, 100)}%` }}
                />
                <div className="bar-glow" style={{ left: `${Math.min(levelProgress, 100)}%` }} />
            </div>

            {!isMaxLevel && (
                <div className="next-level">
                    <span className="next-label">{t('nextLevel', { level: level + 1 })}</span>
                    <span className="xp-remaining">
                        {t('xpToGo', { xp: (nextLevelXp - currentXp).toLocaleString() })}
                    </span>
                </div>
            )}

            <style jsx>{`
                .xp-progress {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    padding: 20px;
                    border-radius: 14px;
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                }
                .progress-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .level-badge {
                    font-size: 0.8rem;
                    font-weight: 700;
                    color: #ffd700;
                    background: rgba(255, 215, 0, 0.1);
                    padding: 4px 12px;
                    border-radius: 20px;
                    border: 1px solid rgba(255, 215, 0, 0.2);
                }
                .progress-label {
                    font-size: 0.75rem;
                    color: rgba(255, 255, 255, 0.45);
                    font-weight: 500;
                }
                .progress-label.max-level {
                    color: #ffd700;
                    font-weight: 700;
                    letter-spacing: 0.05em;
                }
                .bar-container {
                    position: relative;
                    height: 8px;
                    background: rgba(255, 255, 255, 0.06);
                    border-radius: 4px;
                    overflow: hidden;
                }
                .bar-fill {
                    height: 100%;
                    border-radius: 4px;
                    background: linear-gradient(90deg, #ffd700, #ff8c00);
                    transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
                    position: relative;
                }
                .bar-glow {
                    position: absolute;
                    top: -2px;
                    width: 12px;
                    height: 12px;
                    border-radius: 50%;
                    background: #ffd700;
                    box-shadow: 0 0 12px rgba(255, 215, 0, 0.5);
                    transform: translateX(-50%);
                    transition: left 0.8s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .next-level {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .next-label {
                    font-size: 0.7rem;
                    color: rgba(255, 255, 255, 0.3);
                    font-weight: 500;
                }
                .xp-remaining {
                    font-size: 0.7rem;
                    color: rgba(255, 215, 0, 0.5);
                    font-weight: 500;
                }
            `}</style>
        </div>
    );
}
