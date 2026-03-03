/**
 * Credential card component.
 *
 * Displays a soulbound credential NFT with track info,
 * level, courses completed, and XP attributes.
 */
'use client';

import { useTranslations } from 'next-intl';
import type { CredentialInfo } from '@/context/solana/helius-service';
import { TRACK_NAMES } from '@/context/solana/credential-service';

interface CredentialCardProps {
    credential: CredentialInfo;
    onClick?: () => void;
}

export function CredentialCard({ credential, onClick }: CredentialCardProps) {
    const t = useTranslations('credential');
    const tc = useTranslations('common');
    const trackId = credential.attributes.trackId ?? 0;
    const trackName = TRACK_NAMES[trackId] ?? `${t('track')} ${trackId}`;
    const level = credential.attributes.level ?? 1;
    const courses = credential.attributes.coursesCompleted ?? 0;
    const totalXp = credential.attributes.totalXp ?? 0;

    // Different accent colors per track
    const trackColors: Record<number, string> = {
        1: '#14F195', // Anchor — green
        2: '#9945FF', // DeFi — purple
        3: '#00D1FF', // Mobile — cyan
        4: '#FF6B6B', // Pinocchio — coral
        5: '#FFD700', // Token — gold
    };
    const accent = trackColors[trackId] ?? '#9945FF';

    return (
        <button
            className="credential-card"
            onClick={onClick}
            type="button"
            id={`credential-${credential.assetId.slice(0, 8)}`}
        >
            <div
                className="card-accent"
                style={{
                    background: `linear-gradient(135deg, ${accent}22 0%, ${accent}08 100%)`,
                    borderBottom: `1px solid ${accent}22`,
                }}
            >
                <div className="track-name" style={{ color: accent }}>
                    {trackName}
                </div>
                <div className="soulbound-tag">{t('soulbound')}</div>
            </div>

            <div className="card-content">
                <h3 className="credential-name">{credential.name}</h3>

                <div className="attributes">
                    <div className="attr">
                        <span className="attr-icon">🎯</span>
                        <span className="attr-label">{tc('level')}</span>
                        <span className="attr-value">{level}</span>
                    </div>
                    <div className="attr">
                        <span className="attr-icon">📚</span>
                        <span className="attr-label">{tc('courses')}</span>
                        <span className="attr-value">{courses}</span>
                    </div>
                    <div className="attr">
                        <span className="attr-icon">⚡</span>
                        <span className="attr-label">XP</span>
                        <span className="attr-value">{totalXp.toLocaleString()}</span>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .credential-card {
                    display: flex;
                    flex-direction: column;
                    border-radius: 16px;
                    overflow: hidden;
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    cursor: pointer;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    text-align: left;
                    width: 100%;
                }
                .credential-card:hover {
                    transform: translateY(-4px);
                    border-color: rgba(255, 255, 255, 0.15);
                    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3),
                                0 0 0 1px rgba(255, 255, 255, 0.05);
                }
                .card-accent {
                    padding: 16px 20px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .track-name {
                    font-size: 0.75rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }
                .soulbound-tag {
                    font-size: 0.6rem;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.08em;
                    color: rgba(255, 255, 255, 0.3);
                    background: rgba(255, 255, 255, 0.06);
                    padding: 2px 8px;
                    border-radius: 20px;
                }
                .card-content {
                    padding: 16px 20px 20px;
                    display: flex;
                    flex-direction: column;
                    gap: 14px;
                }
                .credential-name {
                    font-size: 1.05rem;
                    font-weight: 700;
                    color: rgba(255, 255, 255, 0.95);
                    margin: 0;
                    line-height: 1.3;
                }
                .attributes {
                    display: flex;
                    gap: 12px;
                }
                .attr {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    font-size: 0.75rem;
                    color: rgba(255, 255, 255, 0.5);
                    background: rgba(255, 255, 255, 0.04);
                    padding: 4px 10px;
                    border-radius: 20px;
                }
                .attr-icon {
                    font-size: 0.75rem;
                }
                .attr-label {
                    color: rgba(255, 255, 255, 0.35);
                    margin-right: 2px;
                }
                .attr-value {
                    font-weight: 700;
                    color: rgba(255, 255, 255, 0.7);
                }
            `}</style>
        </button>
    );
}
