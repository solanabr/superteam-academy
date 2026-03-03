'use client';

import { useTranslations } from 'next-intl';

interface LinkedAccount {
    provider: string;
    provider_id: string;
}

interface UserProfileCardProps {
    user: {
        id: string;
        name?: string | null;
        email?: string | null;
        wallet_address?: string;
        linked_accounts?: LinkedAccount[];
    };
}

const PROVIDER_COLORS: Record<string, string> = {
    google: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    github: 'bg-gray-500/10 text-gray-300 border-gray-500/20',
    wallet: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
};

function getProviderStyle(provider: string): string {
    return PROVIDER_COLORS[provider] ?? 'bg-gray-500/10 text-gray-400 border-gray-500/20';
}

function formatWalletAddress(address: string): string {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function UserProfileCard({ user }: UserProfileCardProps) {
    const t = useTranslations('profile');
    const ts = useTranslations('settings');

    return (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
                {t('title')}
            </h2>
            <div className="space-y-3 text-sm">
                {user.name && (
                    <div className="flex justify-between items-center py-2 border-b border-gray-800">
                        <span className="text-gray-500">{ts('profile.name')}</span>
                        <span className="text-gray-300">{user.name}</span>
                    </div>
                )}
                {user.email && (
                    <div className="flex justify-between items-center py-2 border-b border-gray-800">
                        <span className="text-gray-500">{ts('profile.email')}</span>
                        <span className="text-gray-300">{user.email}</span>
                    </div>
                )}
                {user.wallet_address && (
                    <div className="flex justify-between items-center py-2 border-b border-gray-800">
                        <span className="text-gray-500">{ts('account.wallet')}</span>
                        <span className="text-gray-300 font-mono text-xs">
                            {formatWalletAddress(user.wallet_address)}
                        </span>
                    </div>
                )}
                {user.linked_accounts && user.linked_accounts.length > 0 && (
                    <div className="flex justify-between items-center py-2">
                        <span className="text-gray-500">{ts('account.linked')}</span>
                        <div className="flex gap-2">
                            {user.linked_accounts.map((account) => (
                                <span
                                    key={account.provider}
                                    className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${getProviderStyle(account.provider)}`}
                                >
                                    {account.provider}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
