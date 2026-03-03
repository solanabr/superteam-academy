'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { goeyToast } from 'goey-toast';

interface WalletLinkStepProps {
    onComplete: () => void;
    onSkip: () => void;
    isSubmitting: boolean;
}

export function WalletLinkStep({ onComplete, onSkip, isSubmitting }: WalletLinkStepProps) {
    const t = useTranslations('onboarding');
    const { publicKey, signMessage, connected } = useWallet();
    const { setVisible } = useWalletModal();
    const [linking, setLinking] = useState(false);

    const handleLink = async () => {
        if (!connected || !publicKey || !signMessage) {
            setVisible(true);
            return;
        }

        setLinking(true);
        try {
            const walletAddress = publicKey.toBase58();

            // Step 1: Get nonce
            const nonceRes = await fetch('/api/auth/wallet/sign-message', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ walletAddress }),
            });

            if (!nonceRes.ok) throw new Error('Failed to get sign message');
            const { message } = await nonceRes.json();

            goeyToast.info('Please approve the sign request...');

            // Step 2: Sign
            const messageBytes = new TextEncoder().encode(message);
            const signatureBytes = await signMessage(messageBytes);
            const bs58 = await import('bs58');
            const signature = bs58.default.encode(signatureBytes);

            // Step 3: Link wallet
            const linkRes = await fetch('/api/auth/wallet/link', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ walletAddress, message, signature }),
            });

            if (!linkRes.ok) {
                const data = await linkRes.json();
                throw new Error(data.error || 'Failed to link wallet');
            }

            goeyToast.success('Wallet linked!');
            onComplete();
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Failed to link wallet';
            if (msg.toLowerCase().includes('rejected') || msg.toLowerCase().includes('cancelled')) {
                goeyToast.warning('Signing cancelled');
            } else {
                goeyToast.error(msg);
            }
        } finally {
            setLinking(false);
        }
    };

    return (
        <div>
            <div className="text-center mb-8">
                <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
                    {t('walletLinkTitle')}
                </h1>
                <p className="font-supreme text-muted-foreground mt-2 text-base">
                    {t('walletLinkSubtitle')}
                </p>
            </div>

            <div className="max-w-sm mx-auto">
                {/* Wallet icon */}
                <div className="flex justify-center mb-6">
                    <div className="w-16 h-16 rounded-2xl bg-brand-green/10 dark:bg-brand-green/20 flex items-center justify-center">
                        <svg className="w-8 h-8 text-brand-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 013 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 013 6v3" />
                        </svg>
                    </div>
                </div>

                {/* Link button */}
                <button
                    id="wallet-link-btn"
                    onClick={handleLink}
                    disabled={linking || isSubmitting}
                    className="w-full cta-primary px-6 py-3 rounded-full cursor-pointer font-supreme font-semibold text-sm transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed mb-3"
                >
                    {linking ? (
                        <span className="flex items-center justify-center gap-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-brand-black" />
                            {t('linkingWallet')}
                        </span>
                    ) : connected ? (
                        t('linkWallet')
                    ) : (
                        t('connectAndLink')
                    )}
                </button>

                {/* Skip button */}
                <button
                    id="wallet-skip-btn"
                    onClick={onSkip}
                    disabled={linking || isSubmitting}
                    className="w-full px-6 py-3 rounded-full cursor-pointer border border-border font-supreme font-medium text-sm text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    {t('skipForNow')}
                </button>

                {/* On-chain note */}
                <p className="font-supreme text-xs text-muted-foreground text-center mt-4 leading-relaxed">
                    {t('walletNote')}
                </p>
            </div>
        </div>
    );
}
