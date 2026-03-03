/**
 * CredentialsWidget — Mint green pastel card showing on-chain NFT credentials.
 */
'use client';

import { useCredentials } from '@/context/hooks/useCredentials';
import { useWallet } from '@solana/wallet-adapter-react';
import { Award, ExternalLink } from 'lucide-react';
import { Link } from '@/context/i18n/navigation';

export function CredentialsWidget() {
    const { publicKey } = useWallet();
    const walletAddress = publicKey?.toBase58() ?? null;
    const { data: credentials, isLoading } = useCredentials(walletAddress);

    return (
        <div
            className="rounded-3xl p-5 font-supreme shadow-sm"
            style={{ backgroundColor: 'var(--dash-card-mint)', color: '#1b231d', minHeight: 240 }}
        >
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold font-display" style={{ color: '#1b231d' }}>
                    Credentials
                </h3>
                <Link
                    href="/achievements"
                    className="text-xs font-semibold hover:underline"
                    style={{ color: '#0f6a37' }}
                >
                    View all
                </Link>
            </div>

            {isLoading ? (
                <div className="space-y-3">
                    {Array.from({ length: 2 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl animate-pulse" style={{ backgroundColor: 'rgba(0,0,0,0.08)' }} />
                            <div className="flex-1 h-4 rounded animate-pulse" style={{ backgroundColor: 'rgba(0,0,0,0.08)' }} />
                        </div>
                    ))}
                </div>
            ) : !walletAddress ? (
                <div className="text-center py-6">
                    <Award className="w-8 h-8 mx-auto mb-2" style={{ color: '#2a5040' }} />
                    <p className="text-sm" style={{ color: '#2a5040' }}>Connect wallet to see credentials</p>
                </div>
            ) : !credentials || credentials.length === 0 ? (
                <div className="text-center py-6">
                    <Award className="w-8 h-8 mx-auto mb-2" style={{ color: '#2a5040' }} />
                    <p className="text-sm" style={{ color: '#2a5040' }}>No credentials earned yet</p>
                    <p className="text-xs mt-1" style={{ color: '#3a6050' }}>
                        Complete courses to earn on-chain NFT credentials
                    </p>
                </div>
            ) : (
                <div className="overflow-y-auto hide-scrollbar" style={{ maxHeight: 180 }}>
                    <div className="space-y-2">
                        {credentials.slice(0, 5).map((cred) => (
                            <div
                                key={cred.assetId}
                                className="flex items-center gap-3 p-2.5 -mx-1 rounded-xl transition-colors"
                                onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.35)')}
                                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                            >
                                <div
                                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                                    style={{ backgroundColor: 'rgba(255,255,255,0.5)' }}
                                >
                                    <Award className="w-5 h-5" style={{ color: '#0f6a37' }} />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <span className="text-sm font-semibold block truncate" style={{ color: '#1b231d' }}>
                                        {cred.name || 'Credential'}
                                    </span>
                                    {cred.collection && (
                                        <span className="text-[11px] block truncate" style={{ color: '#3a6050' }}>
                                            {cred.collection}
                                        </span>
                                    )}
                                </div>

                                <a
                                    href={`https://explorer.solana.com/address/${cred.assetId}?cluster=devnet`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="shrink-0 hover:opacity-70"
                                    title="View on Explorer"
                                    style={{ color: '#2a5040' }}
                                >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
