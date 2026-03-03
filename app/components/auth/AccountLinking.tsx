'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/app/providers/AuthProvider';
import { useAccountLinking } from '@/context/hooks/useAccountLinking';

export function AccountLinking() {
    const t = useTranslations('settings');
    const tc = useTranslations('common');
    const { user } = useAuth();
    const { linkedAccounts, linkGoogle, linkGitHub, unlinkProvider, hasProvider, isLoading, refresh } =
        useAccountLinking();
    const [actionError, setActionError] = useState<string | null>(null);

    if (!user) return null;

    const handleUnlink = async (provider: string) => {
        setActionError(null);
        try {
            await unlinkProvider(provider);
            await refresh();
        } catch (err) {
            setActionError(err instanceof Error ? err.message : `Failed to unlink ${provider}`);
        }
    };

    const handleLink = async (provider: string) => {
        setActionError(null);
        try {
            if (provider === 'google') await linkGoogle();
            if (provider === 'github') await linkGitHub();
        } catch (err) {
            setActionError(err instanceof Error ? err.message : `Failed to link ${provider}`);
        }
    };

    return (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">{t('account.linked')}</h2>

            {actionError && (
                <div className="bg-red-900/20 border border-red-800 text-red-400 text-sm p-3 rounded-lg mb-4">
                    {actionError}
                </div>
            )}

            {isLoading && (
                <p className="text-gray-500 text-sm">{tc('loading')}</p>
            )}

            <div className="space-y-3">
                {/* Wallet */}
                <div className="flex items-center justify-between py-3 border-b border-gray-800">
                    <div className="flex items-center gap-3">
                        <span className="text-gray-400">🔑</span>
                        <div>
                            <p className="text-white text-sm font-medium">{t('account.wallet')}</p>
                            {hasProvider('wallet') && user.wallet_address && (
                                <p className="text-gray-500 text-xs font-mono">
                                    {user.wallet_address.slice(0, 8)}...{user.wallet_address.slice(-8)}
                                </p>
                            )}
                        </div>
                    </div>
                    {hasProvider('wallet') ? (
                        <button
                            onClick={() => handleUnlink('wallet')}
                            disabled={linkedAccounts.length <= 1}
                            className="text-red-400 hover:text-red-300 text-sm disabled:opacity-50"
                        >
                            {tc('unlink')}
                        </button>
                    ) : (
                        <span className="text-gray-600 text-sm">{tc('notLinked')}</span>
                    )}
                </div>

                {/* Google */}
                <div className="flex items-center justify-between py-3 border-b border-gray-800">
                    <div className="flex items-center gap-3">
                        <span className="text-gray-400">📧</span>
                        <p className="text-white text-sm font-medium">Google</p>
                    </div>
                    {hasProvider('google') ? (
                        <button
                            onClick={() => handleUnlink('google')}
                            disabled={linkedAccounts.length <= 1}
                            className="text-red-400 hover:text-red-300 text-sm disabled:opacity-50"
                        >
                            {tc('unlink')}
                        </button>
                    ) : (
                        <button
                            onClick={() => handleLink('google')}
                            className="text-purple-400 hover:text-purple-300 text-sm"
                        >
                            {tc('link')}
                        </button>
                    )}
                </div>

                {/* GitHub */}
                <div className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                        <span className="text-gray-400">🐙</span>
                        <p className="text-white text-sm font-medium">GitHub</p>
                    </div>
                    {hasProvider('github') ? (
                        <button
                            onClick={() => handleUnlink('github')}
                            disabled={linkedAccounts.length <= 1}
                            className="text-red-400 hover:text-red-300 text-sm disabled:opacity-50"
                        >
                            {tc('unlink')}
                        </button>
                    ) : (
                        <button
                            onClick={() => handleLink('github')}
                            className="text-purple-400 hover:text-purple-300 text-sm"
                        >
                            {tc('link')}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
