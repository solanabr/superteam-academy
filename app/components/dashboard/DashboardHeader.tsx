'use client';

import { signOut } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { NotificationBell } from '@/components/notification/NotificationBell';
import { NotificationErrorBoundary } from '@/components/notification/NotificationErrorBoundary';
import { goeyToast } from 'goey-toast';

interface DashboardUser {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    wallet_address?: string;
}

interface DashboardHeaderProps {
    user: DashboardUser;
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
    const t = useTranslations('dashboard');
    const tc = useTranslations('common');

    const displayName = user.name ?? user.email ?? user.wallet_address ?? tc('fallbackName');
    const initials = (user.name ?? user.email ?? 'U')
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();

    const handleSignOut = async () => {
        goeyToast.info('Signing out...');
        sessionStorage.setItem('auth_signout', '1');
        await signOut({ callbackUrl: '/login' });
    };

    return (
        <header className="flex items-center justify-between py-6">
            <div className="flex items-center gap-4">
                {user.image ? (
                    <img
                        src={user.image}
                        alt={displayName}
                        className="w-12 h-12 rounded-full border-2 border-purple-500/30"
                    />
                ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white font-semibold text-sm">
                        {initials}
                    </div>
                )}
                <div>
                    <h1 className="text-2xl font-bold text-white">
                        {t('welcome', { name: displayName.split(' ')[0] })}
                    </h1>
                    <p className="text-gray-400 text-sm">
                        {t('readyToLearn')}
                    </p>
                </div>
            </div>
            <div className="flex items-center gap-3">
                <NotificationErrorBoundary>
                    <NotificationBell />
                </NotificationErrorBoundary>
                <button
                    onClick={handleSignOut}
                    className="text-gray-400 hover:text-white text-sm px-4 py-2 rounded-lg border border-gray-700 hover:border-gray-600 transition-all duration-200"
                >
                    {tc('signOut')}
                </button>
            </div>
        </header>
    );
}
