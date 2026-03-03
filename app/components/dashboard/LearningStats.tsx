'use client';

import { useXpBalance } from '@/context/hooks/useXpBalance';
import { useWallet } from '@solana/wallet-adapter-react';
import { useStreak } from '@/context/hooks/useStreak';
import { useCredentials } from '@/context/hooks/useCredentials';
import { useTranslations } from 'next-intl';

interface StatCard {
    label: string;
    value: string;
    icon: React.ReactNode;
    gradient: string;
}

export function LearningStats() {
    const t = useTranslations('dashboard');
    const tc = useTranslations('common');
    const ts = useTranslations('streak');
    const { publicKey } = useWallet();
    const { data: xpData } = useXpBalance(publicKey);
    const { streak } = useStreak();
    const { data: credentials } = useCredentials(publicKey?.toBase58() ?? null);

    const xpBalance = xpData?.balance ?? 0;
    const level = xpData?.level ?? 1;
    const currentStreak = streak?.currentStreak ?? 0;
    const completedCourses = credentials?.length ?? 0;

    const statCards: StatCard[] = [
        {
            label: t('stats.totalXp'),
            value: xpBalance.toLocaleString(),
            gradient: 'from-purple-600 to-indigo-600',
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                </svg>
            ),
        },
        {
            label: tc('level'),
            value: String(level),
            gradient: 'from-amber-500 to-orange-600',
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                </svg>
            ),
        },
        {
            label: ts('title'),
            value: ts('current', { count: currentStreak }),
            gradient: 'from-red-500 to-rose-600',
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z" />
                </svg>
            ),
        },
        {
            label: t('stats.courses'),
            value: String(completedCourses),
            gradient: 'from-emerald-500 to-teal-600',
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
                </svg>
            ),
        },
    ];

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map((stat) => (
                <div
                    key={stat.label}
                    className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex flex-col gap-3"
                >
                    <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${stat.gradient} flex items-center justify-center text-white`}>
                        {stat.icon}
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-white">{stat.value}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
                    </div>
                </div>
            ))}
        </div>
    );
}
