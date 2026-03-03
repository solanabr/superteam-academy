/**
 * Credential display grid with empty state.
 *
 * Shows a grid of CredentialCard components or an
 * empty state message when the user has no credentials.
 */
'use client';

import { useTranslations } from 'next-intl';
import type { CredentialInfo } from '@/context/solana/helius-service';
import { CredentialCard } from './CredentialCard';

interface CredentialDisplayProps {
    credentials: CredentialInfo[];
    loading?: boolean;
    onCredentialClick?: (credential: CredentialInfo) => void;
}

export function CredentialDisplay({
    credentials,
    loading = false,
    onCredentialClick,
}: CredentialDisplayProps) {
    const t = useTranslations('credential');
    if (loading) {
        return (
            <div className="credential-loading" id="credential-display-loading">
                <div className="loading-spinner" />
                <p className="loading-text">{t('loading')}</p>

                <style jsx>{`
                    .credential-loading {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        gap: 16px;
                        padding: 48px 24px;
                    }
                    .loading-spinner {
                        width: 32px;
                        height: 32px;
                        border: 3px solid rgba(255, 255, 255, 0.1);
                        border-top-color: #9945FF;
                        border-radius: 50%;
                        animation: spin 0.8s linear infinite;
                    }
                    @keyframes spin {
                        to { transform: rotate(360deg); }
                    }
                    .loading-text {
                        font-size: 0.85rem;
                        color: rgba(255, 255, 255, 0.35);
                    }
                `}</style>
            </div>
        );
    }

    if (credentials.length === 0) {
        return (
            <div className="credential-empty" id="credential-display-empty">
                <div className="empty-icon">🏅</div>
                <h3 className="empty-title">{t('empty')}</h3>
                <p className="empty-description">
                    {t('emptyHint')}
                </p>

                <style jsx>{`
                    .credential-empty {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        text-align: center;
                        padding: 48px 24px;
                        border-radius: 16px;
                        background: rgba(255, 255, 255, 0.02);
                        border: 1px dashed rgba(255, 255, 255, 0.1);
                    }
                    .empty-icon {
                        font-size: 2.5rem;
                        margin-bottom: 8px;
                    }
                    .empty-title {
                        font-size: 1.1rem;
                        font-weight: 700;
                        color: rgba(255, 255, 255, 0.6);
                        margin: 0 0 8px;
                    }
                    .empty-description {
                        font-size: 0.85rem;
                        color: rgba(255, 255, 255, 0.35);
                        max-width: 320px;
                        margin: 0;
                        line-height: 1.5;
                    }
                `}</style>
            </div>
        );
    }

    return (
        <div className="credential-grid" id="credential-display">
            {credentials.map(credential => (
                <CredentialCard
                    key={credential.assetId}
                    credential={credential}
                    onClick={() => onCredentialClick?.(credential)}
                />
            ))}

            <style jsx>{`
                .credential-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                    gap: 16px;
                }
            `}</style>
        </div>
    );
}
