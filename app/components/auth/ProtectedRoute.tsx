'use client';

import { ReactNode, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/app/providers/AuthProvider';
import { useRouter } from 'next/navigation';

interface ProtectedRouteProps {
    children: ReactNode;
    requireWallet?: boolean;
}

export function ProtectedRoute({ children, requireWallet = false }: ProtectedRouteProps) {
    const t = useTranslations('auth');
    const { user, isLoading, isAuthenticated } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [isLoading, isAuthenticated, router]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-950">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-500" />
            </div>
        );
    }

    // Show spinner instead of null flash while redirect happens
    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-950">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-500 mx-auto mb-4" />
                    <p className="text-gray-400 text-sm">{t('redirecting')}</p>
                </div>
            </div>
        );
    }

    if (requireWallet && !user?.wallet_address) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-950">
                <div className="text-center space-y-4">
                    <h2 className="text-xl font-semibold text-white">{t('walletRequired')}</h2>
                    <p className="text-gray-400">
                        {t('walletRequiredHint')}
                    </p>
                    <button
                        onClick={() => router.push('/settings?tab=accounts')}
                        className="bg-purple-600 hover:bg-purple-500 text-white py-2 px-4 rounded-lg transition-colors"
                    >
                        {t('linkWallet')}
                    </button>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
