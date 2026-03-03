'use client';

/**
 * Certificate card — premium classic certificate with on-chain verification.
 *
 * Uses the Superteam Academy brand palette:
 * - #ffd23f (gold)      — borders, accents, decorative elements
 * - #f7eacb (cream)     — background
 * - #2f6b3f (forest)    — secondary text, labels
 * - #008c4c (emerald)   — highlights, seal
 * - #1b231d (dark)      — primary text
 *
 * Fonts: Playfair Display (headings), Cormorant Garamond (body/labels)
 */

import { useState } from 'react';
import type { DasAsset } from '@/context/solana/helius-service';

const SOLANA_CLUSTER = process.env.NEXT_PUBLIC_SOLANA_CLUSTER || 'devnet';

interface CertificateCardProps {
    credential: DasAsset | null;
    assetId: string;
    isLoading?: boolean;
    error?: string | null;
}

function getAttr(credential: DasAsset, key: string): string | undefined {
    const attrs = credential.content?.metadata?.attributes;
    if (!attrs) return undefined;
    return attrs.find((a) => a.trait_type === key)?.value?.toString();
}

export function CertificateCard({ credential, assetId, isLoading, error }: CertificateCardProps) {
    const [copied, setCopied] = useState(false);
    const clusterParam = SOLANA_CLUSTER === 'mainnet-beta' ? '' : `?cluster=${SOLANA_CLUSTER}`;
    const explorerUrl = `https://explorer.solana.com/address/${assetId}${clusterParam}`;

    if (isLoading) {
        return (
            <div className="cert-loading">
                <div className="cert-spinner" />
                <p>Loading credential...</p>
                <style jsx>{`
                    .cert-loading { padding: 64px; text-align: center; color: #2f6b3f; font-family: var(--font-cormorant), Georgia, serif; }
                    .cert-spinner { width: 32px; height: 32px; border: 2px solid #f7eacb; border-top-color: #008c4c; border-radius: 50%; margin: 0 auto 16px; animation: spin 0.8s linear infinite; }
                    @keyframes spin { to { transform: rotate(360deg); } }
                `}</style>
            </div>
        );
    }

    if (error || !credential) {
        return (
            <div className="cert-error">
                <p className="cert-error-title">⚠️ {error || 'Credential not found'}</p>
                <a href={explorerUrl} target="_blank" rel="noopener noreferrer" className="cert-error-link">
                    View on Solana Explorer →
                </a>
                <style jsx>{`
                    .cert-error { padding: 48px; text-align: center; background: #f7eacb; border-radius: 16px; border: 2px solid #ffd23f; }
                    .cert-error-title { color: #1b231d; font-size: 16px; font-weight: 600; margin: 0 0 12px; font-family: var(--font-cormorant), Georgia, serif; }
                    .cert-error-link { color: #008c4c; font-size: 13px; text-decoration: none; font-family: var(--font-cormorant), Georgia, serif; }
                    .cert-error-link:hover { text-decoration: underline; }
                `}</style>
            </div>
        );
    }

    const name = credential.content?.metadata?.name || 'Credential';
    const description = credential.content?.metadata?.description || '';
    const track = getAttr(credential, 'track') || 'Solana Developer';
    const level = getAttr(credential, 'level') || '1';
    const coursesCompleted = getAttr(credential, 'courses_completed') || '1';
    const totalXp = getAttr(credential, 'total_xp') || '0';
    const issuedAt = getAttr(credential, 'issued_at') || '';
    const owner = credential.ownership?.owner;

    const handleCopy = () => {
        navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="cert-wrapper">
            <div className="cert-card">
                {/* Template background image */}
                <img
                    src="/certificate-template.svg"
                    alt=""
                    className="cert-bg"
                    aria-hidden="true"
                />

                {/* Dynamic content overlay */}
                <div className="cert-overlay">
                    {/* Recipient / Credential name */}
                    <div className="cert-name-area">
                        <p className="cert-name">{name}</p>
                    </div>

                    {/* Course info */}
                    <div className="cert-course-area">
                        <p className="cert-course">{description || track}</p>
                    </div>

                    {/* Stats row */}
                    <div className="cert-stats-area">
                        <div className="cert-stat">
                            <span className="cert-stat-val">{track}</span>
                        </div>
                        <div className="cert-stat">
                            <span className="cert-stat-val">Lv. {level}</span>
                        </div>
                        <div className="cert-stat">
                            <span className="cert-stat-val">{parseInt(totalXp).toLocaleString()} XP</span>
                        </div>
                        <div className="cert-stat">
                            <span className="cert-stat-val">{issuedAt || '—'}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Details bar */}
            <div className="cert-details">
                <div className="cert-detail">
                    <span className="cert-detail-label">Mint Address</span>
                    <span className="cert-detail-value">{assetId.slice(0, 8)}...{assetId.slice(-6)}</span>
                </div>
                {owner && (
                    <div className="cert-detail">
                        <span className="cert-detail-label">Owner</span>
                        <span className="cert-detail-value">{owner.slice(0, 6)}...{owner.slice(-4)}</span>
                    </div>
                )}
                <div className="cert-detail">
                    <span className="cert-detail-label">Courses</span>
                    <span className="cert-detail-value">{coursesCompleted} completed</span>
                </div>
                <div className="cert-detail">
                    <span className="cert-detail-label">Type</span>
                    <span className="cert-detail-value cert-soulbound">◆ Soulbound</span>
                </div>
            </div>

            {/* Actions */}
            <div className="cert-actions">
                <a href={explorerUrl} target="_blank" rel="noopener noreferrer" className="cert-btn cert-btn-primary">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                        <polyline points="15 3 21 3 21 9" />
                        <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                    Verify on Explorer
                </a>
                <button onClick={handleCopy} className="cert-btn cert-btn-secondary">
                    {copied ? '✓ Copied!' : '🔗 Copy Link'}
                </button>
                <a
                    href={`https://x.com/intent/tweet?text=${encodeURIComponent(
                        `I earned "${name}" on @SuperteamAcademy! 🎓\n\n` +
                        `Track: ${track} | Level ${level} | ${totalXp} XP\n\n` +
                        `Verify on-chain: ${explorerUrl}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="cert-btn cert-btn-secondary"
                >
                    Share on 𝕏
                </a>
            </div>

            <style jsx>{`
                .cert-wrapper {
                    max-width: 660px;
                    margin: 0 auto;
                }

                .cert-card {
                    position: relative;
                    border-radius: 8px;
                    overflow: hidden;
                    border: 3px solid #ffd23f;
                    box-shadow: 0 8px 32px rgba(27,35,29,0.15);
                    background: #f7eacb;
                    aspect-ratio: 1200 / 800;
                }

                .cert-bg {
                    position: absolute;
                    inset: 0;
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .cert-overlay {
                    position: absolute;
                    inset: 0;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    pointer-events: none;
                }

                .cert-name-area {
                    position: absolute;
                    top: 36%;
                    left: 50%;
                    transform: translateX(-50%);
                    text-align: center;
                    width: 60%;
                }

                .cert-name {
                    font-family: var(--font-playfair), 'Playfair Display', Georgia, serif;
                    font-size: clamp(18px, 3vw, 32px);
                    font-weight: 700;
                    color: #1b231d;
                    margin: 0;
                    line-height: 1.2;
                }

                .cert-course-area {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translateX(-50%);
                    text-align: center;
                    width: 55%;
                }

                .cert-course {
                    font-family: var(--font-cormorant), 'Cormorant Garamond', Georgia, serif;
                    font-size: clamp(12px, 1.8vw, 18px);
                    font-weight: 500;
                    color: #008c4c;
                    margin: 0;
                    line-height: 1.4;
                }

                .cert-stats-area {
                    position: absolute;
                    top: 63%;
                    left: 50%;
                    transform: translateX(-50%);
                    display: flex;
                    gap: clamp(16px, 4vw, 48px);
                    text-align: center;
                }

                .cert-stat-val {
                    font-family: var(--font-cormorant), 'Cormorant Garamond', Georgia, serif;
                    font-size: clamp(10px, 1.5vw, 14px);
                    font-weight: 600;
                    color: #1b231d;
                }

                .cert-details {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 20px;
                    padding: 20px 24px;
                    background: #1b231d;
                    border-radius: 0 0 12px 12px;
                    margin-top: -4px;
                }

                .cert-detail {
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                }

                .cert-detail-label {
                    font-family: var(--font-cormorant), Georgia, serif;
                    font-size: 10px;
                    color: #2f6b3f;
                    text-transform: uppercase;
                    letter-spacing: 0.1em;
                    font-weight: 600;
                }

                .cert-detail-value {
                    font-family: var(--font-geist-mono), 'SF Mono', monospace;
                    font-size: 13px;
                    color: #f7eacb;
                }

                .cert-soulbound { color: #ffd23f; }

                .cert-actions {
                    display: flex;
                    gap: 10px;
                    justify-content: center;
                    padding-top: 20px;
                    flex-wrap: wrap;
                }

                .cert-btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    padding: 10px 18px;
                    border-radius: 8px;
                    font-family: var(--font-cormorant), Georgia, serif;
                    font-size: 14px;
                    font-weight: 600;
                    text-decoration: none;
                    cursor: pointer;
                    transition: all 0.2s;
                    border: none;
                }

                .cert-btn-primary {
                    background: #008c4c;
                    color: #f7eacb;
                    border: 1px solid #2f6b3f;
                }

                .cert-btn-primary:hover {
                    background: #2f6b3f;
                }

                .cert-btn-secondary {
                    background: #1b231d;
                    color: #f7eacb;
                    border: 1px solid #2f6b3f;
                }

                .cert-btn-secondary:hover {
                    background: #2f6b3f;
                    color: #f7eacb;
                }

                @media (max-width: 640px) {
                    .cert-details { padding: 16px; gap: 12px; }
                    .cert-actions { flex-direction: column; }
                    .cert-btn { justify-content: center; }
                }
            `}</style>
        </div>
    );
}
