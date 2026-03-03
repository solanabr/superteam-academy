/**
 * CredentialsSection — Displays on-chain cNFT credentials for the connected wallet.
 * Uses useCredentials hook to fetch from Helius DAS API.
 * Matches dashboard card styling — brand fonts, lucide icons, Tailwind.
 */
'use client';

import { useCredentials } from '@/context/hooks/useCredentials';
import { useWallet } from '@solana/wallet-adapter-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/context/i18n/navigation';
import { Award, ExternalLink, Wallet, Loader2, Layers, Zap, BookOpen } from 'lucide-react';

const SOLANA_CLUSTER = process.env.NEXT_PUBLIC_SOLANA_CLUSTER || 'devnet';

export function CredentialsSection() {
    const t = useTranslations('achievements');
    const { publicKey } = useWallet();
    const walletAddress = publicKey?.toBase58() ?? null;
    const { data: credentials, isLoading } = useCredentials(walletAddress);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-brand-green-emerald" />
            </div>
        );
    }

    if (!walletAddress) {
        return (
            <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-10 text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto">
                    <Wallet className="w-7 h-7 text-muted-foreground" />
                </div>
                <p className="text-base font-bold text-foreground font-display">
                    {t('connectWallet')}
                </p>
                <p className="text-sm text-muted-foreground font-supreme max-w-md mx-auto">
                    {t('connectWalletDesc')}
                </p>
            </div>
        );
    }

    if (!credentials || credentials.length === 0) {
        return (
            <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-10 text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto">
                    <Award className="w-7 h-7 text-brand-green-emerald" />
                </div>
                <p className="text-base font-bold text-foreground font-display">
                    {t('noCredentials')}
                </p>
                <p className="text-sm text-muted-foreground font-supreme max-w-md mx-auto leading-relaxed">
                    {t('noCredentialsLong')}
                </p>
                <Link
                    href="/courses"
                    className="cta-primary gap-2"
                >
                    <BookOpen className="w-4 h-4" />
                    {t('startLearning')}
                </Link>
            </div>
        );
    }

    const clusterParam = SOLANA_CLUSTER === 'mainnet-beta' ? '' : `?cluster=${SOLANA_CLUSTER}`;

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {credentials.map((cred) => {
                const explorerUrl = `https://explorer.solana.com/address/${cred.assetId}${clusterParam}`;

                return (
                    <div
                        key={cred.assetId}
                        className="rounded-2xl border border-border bg-card p-5 flex flex-col gap-3 hover:border-brand-green-emerald/50 transition-colors shadow-sm"
                    >
                        {/* Header */}
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-xl bg-brand-green-emerald/10 flex items-center justify-center shrink-0">
                                <Award className="w-5 h-5 text-brand-green-emerald" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <h3 className="text-sm font-bold font-supreme text-foreground truncate">
                                    {cred.name || 'Credential'}
                                </h3>
                                {cred.collection && (
                                    <p className="text-[11px] text-muted-foreground font-supreme truncate">
                                        {cred.collection.slice(0, 8)}...{cred.collection.slice(-4)}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Attributes */}
                        <div className="grid grid-cols-2 gap-2">
                            {cred.attributes.level != null && (
                                <div className="rounded-xl bg-muted/50 px-3 py-2">
                                    <span className="text-[10px] text-muted-foreground font-supreme uppercase tracking-wider block">
                                        Level
                                    </span>
                                    <span className="text-sm font-bold font-array text-foreground">
                                        {cred.attributes.level}
                                    </span>
                                </div>
                            )}
                            {cred.attributes.totalXp != null && (
                                <div className="rounded-xl bg-muted/50 px-3 py-2">
                                    <span className="text-[10px] text-muted-foreground font-supreme uppercase tracking-wider block">
                                        XP
                                    </span>
                                    <span className="text-sm font-bold font-array text-foreground flex items-center gap-1">
                                        <Zap className="w-3 h-3 text-brand-yellow" />
                                        {cred.attributes.totalXp.toLocaleString()}
                                    </span>
                                </div>
                            )}
                            {cred.attributes.coursesCompleted != null && (
                                <div className="rounded-xl bg-muted/50 px-3 py-2 col-span-2">
                                    <span className="text-[10px] text-muted-foreground font-supreme uppercase tracking-wider block">
                                        Courses
                                    </span>
                                    <span className="text-sm font-bold font-array text-foreground flex items-center gap-1">
                                        <Layers className="w-3 h-3 text-brand-green-emerald" />
                                        {cred.attributes.coursesCompleted} completed
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Soulbound badge */}
                        <div className="flex items-center gap-1.5 text-[10px] font-semibold text-brand-green-emerald font-supreme uppercase tracking-wider">
                            <span className="w-1.5 h-1.5 rounded-full bg-brand-green-emerald" />
                            Soulbound (Non-Transferable)
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 mt-auto pt-2 border-t border-border/50">
                            <Link
                                href={`/certificates/${cred.assetId}`}
                                className="flex-1 text-center text-xs font-semibold font-supreme text-brand-green-emerald hover:text-brand-green-emerald/80 transition-colors py-1.5 rounded-lg hover:bg-brand-green-emerald/5"
                            >
                                View Certificate
                            </Link>
                            <a
                                href={explorerUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors py-1.5 px-2 rounded-lg hover:bg-muted/50"
                            >
                                <ExternalLink className="w-3 h-3" />
                                Explorer
                            </a>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
