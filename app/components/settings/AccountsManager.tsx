'use client';

/**
 * Accounts manager — linked accounts management.
 * Shows connected providers (Google, GitHub, Wallet) with link/unlink actions.
 * Wallet linking uses the Solana wallet adapter to connect + sign a nonce message.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Mail, Github, Wallet, Link2, Unlink, Loader2 } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { useAccountLinking } from '@/context/hooks/useAccountLinking';
import { goeyToast } from 'goey-toast';

const PROVIDER_CONFIG: Record<string, { icon: typeof Mail; label: string }> = {
    google: { icon: Mail, label: 'Google' },
    github: { icon: Github, label: 'GitHub' },
    wallet: { icon: Wallet, label: 'Wallet' },
};

export function AccountsManager() {
    const t = useTranslations('settings');
    const {
        linkedAccounts,
        isLoading,
        session,
        linkWallet,
        linkGoogle,
        linkGitHub,
        unlinkProvider,
        hasProvider,
    } = useAccountLinking();

    const { publicKey, signMessage, connected } = useWallet();
    const { setVisible } = useWalletModal();
    const [isLinkingWallet, setIsLinkingWallet] = useState(false);
    const [pendingWalletLink, setPendingWalletLink] = useState(false);
    const hasTriggeredLink = useRef(false);

    /** After wallet connects, perform nonce sign + link */
    const performWalletLink = useCallback(async () => {
        if (!publicKey || !signMessage) return;

        setIsLinkingWallet(true);
        try {
            const walletAddress = publicKey.toBase58();

            // Step 1: Get nonce message from server
            const nonceRes = await fetch('/api/auth/wallet/sign-message', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ walletAddress }),
            });

            if (!nonceRes.ok) {
                const data = await nonceRes.json();
                throw new Error(data.error || 'Failed to get sign message');
            }

            const { message } = await nonceRes.json();

            goeyToast.info('Please approve the sign request...');

            // Step 2: Sign message with wallet
            const messageBytes = new TextEncoder().encode(message);
            const signatureBytes = await signMessage(messageBytes);
            const bs58 = await import('bs58');
            const signature = bs58.default.encode(signatureBytes);

            // Step 3: Link wallet via API
            await linkWallet(walletAddress, message, signature);
            goeyToast.success('Wallet linked successfully!');
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Failed to link wallet';
            if (msg.toLowerCase().includes('rejected') || msg.toLowerCase().includes('cancelled')) {
                goeyToast.warning('Wallet request cancelled');
            } else {
                goeyToast.error(msg);
            }
        } finally {
            setIsLinkingWallet(false);
            setPendingWalletLink(false);
        }
    }, [publicKey, signMessage, linkWallet]);

    // When wallet connects and we're pending a link, trigger sign flow
    useEffect(() => {
        if (pendingWalletLink && connected && publicKey && signMessage && !hasTriggeredLink.current) {
            hasTriggeredLink.current = true;
            performWalletLink();
        }
    }, [pendingWalletLink, connected, publicKey, signMessage, performWalletLink]);

    const handleConnectWallet = useCallback(() => {
        if (connected && publicKey && signMessage) {
            // Already connected, just sign
            performWalletLink();
        } else {
            // Open wallet modal, wait for connection
            setPendingWalletLink(true);
            hasTriggeredLink.current = false;
            setVisible(true);
        }
    }, [connected, publicKey, signMessage, performWalletLink, setVisible]);

    const walletConnected = hasProvider('wallet') || !!session?.walletAddress;

    /** Truncate wallet address for display */
    const truncatedAddress = session?.walletAddress
        ? `${session.walletAddress.slice(0, 4)}...${session.walletAddress.slice(-4)}`
        : null;

    const providers = [
        {
            id: 'google',
            connected: hasProvider('google'),
            onLink: linkGoogle,
        },
        {
            id: 'github',
            connected: hasProvider('github'),
            onLink: linkGitHub,
        },
        {
            id: 'wallet',
            connected: walletConnected,
            onLink: handleConnectWallet,
        },
    ];

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 text-brand-green-emerald animate-spin" />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-3">
            {providers.map((provider) => {
                const config = PROVIDER_CONFIG[provider.id] || { icon: Link2, label: provider.id };
                const IconComp = config.icon;
                const isWallet = provider.id === 'wallet';
                const isLinking = isWallet && isLinkingWallet;

                return (
                    <div
                        key={provider.id}
                        className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${provider.connected
                            ? 'bg-brand-green-emerald/5 border-brand-green-emerald/20'
                            : 'bg-muted border-border'
                            }`}
                    >
                        <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${provider.connected ? 'bg-brand-green-emerald/10' : 'bg-muted'
                                }`}>
                                <IconComp className={`w-4 h-4 ${provider.connected ? 'text-brand-green-emerald' : 'text-muted-foreground'
                                    }`} />
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-semibold font-supreme text-foreground">
                                    {config.label}
                                </p>
                                <p className="text-xs text-muted-foreground font-supreme truncate">
                                    {provider.connected
                                        ? (isWallet && truncatedAddress ? truncatedAddress : t('account.linked'))
                                        : 'Not connected'}
                                </p>
                            </div>
                        </div>

                        {provider.connected ? (
                            <button
                                onClick={() => unlinkProvider(provider.id)}
                                disabled={linkedAccounts.length <= 1 && provider.id !== 'wallet'}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-semibold font-supreme disabled:opacity-30 disabled:cursor-not-allowed hover:bg-red-500/20 transition-colors shrink-0"
                            >
                                <Unlink className="w-3 h-3" />
                                Unlink
                            </button>
                        ) : (
                            <button
                                onClick={provider.onLink}
                                disabled={isLinking}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-green-emerald/10 border border-brand-green-emerald/20 text-brand-green-emerald text-xs font-semibold font-supreme hover:bg-brand-green-emerald/20 transition-colors disabled:opacity-50 disabled:cursor-wait shrink-0"
                            >
                                {isLinking ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                    <Link2 className="w-3 h-3" />
                                )}
                                {isLinking ? 'Linking...' : isWallet ? 'Connect' : 'Link'}
                            </button>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
