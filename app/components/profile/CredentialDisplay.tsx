'use client';

/**
 * Credential display — grid of Metaplex Core NFT credential cards.
 * Shows track, level, and asset ID from on-chain metadata.
 */

import { Award, ExternalLink, GraduationCap } from 'lucide-react';
import Link from 'next/link';
import type { CredentialInfo } from '@/context/solana/helius-service';

interface CredentialDisplayProps {
    credentials: CredentialInfo[];
    isLoading?: boolean;
}

export function CredentialDisplay({ credentials, isLoading }: CredentialDisplayProps) {
    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-8">
                <div className="w-5 h-5 border-2 border-brand-green-emerald border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (credentials.length === 0) {
        return (
            <div className="rounded-xl p-8 text-center" style={{ backgroundColor: 'var(--profile-center-muted-bg)', border: '1px solid var(--profile-center-muted-border)' }}>
                <GraduationCap className="w-5 h-5 mx-auto mb-2" style={{ color: 'var(--profile-center-sub)' }} />
                <p className="text-sm font-supreme" style={{ color: 'var(--profile-center-sub)' }}>
                    No credentials yet. Complete courses to earn on-chain credentials!
                </p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {credentials.map((cred) => (
                <Link
                    key={cred.assetId}
                    href={`/certificates/${cred.assetId}`}
                    className="group rounded-2xl p-5 flex flex-col gap-3 transition-colors shadow-sm"
                    style={{ backgroundColor: 'var(--profile-center-muted-bg)', border: '1px solid var(--profile-center-muted-border)' }}
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-brand-green-emerald/10 flex items-center justify-center shrink-0">
                            <Award className="w-5 h-5 text-brand-green-emerald" />
                        </div>
                        <div className="min-w-0">
                            <h3 className="text-sm font-bold font-display truncate" style={{ color: 'var(--profile-center-text)' }}>
                                {cred.name}
                            </h3>
                            <p className="text-xs font-supreme" style={{ color: 'var(--profile-center-sub)' }}>
                                {cred.collection ? `${cred.collection.slice(0, 6)}...` : 'Credential'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-supreme" style={{ color: 'var(--profile-center-sub)' }}>
                        <ExternalLink className="w-3 h-3" />
                        <span>{cred.assetId.slice(0, 6)}...{cred.assetId.slice(-4)}</span>
                    </div>
                </Link>
            ))}
        </div>
    );
}
