'use client';

/**
 * Certificate view page — displays credential NFT details
 * with on-chain verification and sharing options.
 */

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { CertificateCard } from '@/components/profile/CertificateCard';
import type { DasAsset } from '@/context/solana/helius-service';

export default function CertificatePage() {
    const t = useTranslations('certificate');
    const params = useParams();
    const assetId = params.id as string;

    const [credential, setCredential] = useState<DasAsset | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchCredential() {
            try {
                const res = await fetch(`/api/credentials/${assetId}`);
                if (!res.ok) {
                    const data = await res.json();
                    throw new Error(data.error || 'Failed to fetch');
                }
                setCredential(await res.json());
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load credential');
            } finally {
                setLoading(false);
            }
        }
        if (assetId) fetchCredential();
    }, [assetId]);

    return (
        <div style={{ maxWidth: '700px', margin: '0 auto', padding: '40px 0' }}>
            <h1
                style={{
                    fontSize: '24px',
                    fontWeight: 700,
                    margin: '0 0 32px',
                    letterSpacing: '-0.02em',
                    textAlign: 'center',
                }}
            >
                {t('title')}
            </h1>

            <CertificateCard
                credential={credential}
                assetId={assetId}
                isLoading={loading}
                error={error}
            />
        </div>
    );
}
