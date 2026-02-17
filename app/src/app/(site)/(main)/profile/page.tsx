"use client";

import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLang } from '@/contexts/LanguageContext';
import { User, Wallet, Award, BookOpen, Flame } from 'lucide-react';

export default function ProfilePage() {
  const { user, isAuthenticated } = useAuth();
  const { t } = useLang();
  const router = useRouter();

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-gray-950 pt-20 flex items-center justify-center transition-colors">
        <div className="text-center">
          <p className="text-slate-500 dark:text-gray-400 mb-4">{t('profile.connectRequired')}</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-green-500 to-yellow-400 text-gray-950 font-semibold"
          >
            {t('profile.goHome')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950 pt-20 transition-colors">
      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Profile Card */}
        <div className="p-8 rounded-2xl bg-white dark:bg-gray-900/80 border border-slate-200 dark:border-gray-800 shadow-sm dark:shadow-none text-center mb-8">
          <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-green-400 to-yellow-400 flex items-center justify-center text-gray-950 font-bold text-3xl mb-4">
            {user.avatar}
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{user.displayName}</h1>
          <p className="text-slate-400 dark:text-gray-500 text-sm mb-1 capitalize">{t('profile.account').replace('{provider}', user.authProvider)}</p>
          {user.walletAddress && (
            <p className="text-slate-400 dark:text-gray-500 text-xs font-mono flex items-center justify-center gap-1">
              <Wallet size={12} />
              {user.walletAddress.slice(0, 8)}...{user.walletAddress.slice(-6)}
            </p>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-gray-900/80 border border-slate-200 dark:border-gray-800 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center">
              <Award size={20} className="text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{user.xp}</p>
              <p className="text-slate-400 dark:text-gray-500 text-xs">{t('profile.totalXp')}</p>
            </div>
          </div>
          <div className="p-5 rounded-2xl bg-white dark:bg-gray-900/80 border border-slate-200 dark:border-gray-800 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-500/20 flex items-center justify-center">
              <Flame size={20} className="text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{user.streak}</p>
              <p className="text-slate-400 dark:text-gray-500 text-xs">{t('profile.dayStreak')}</p>
            </div>
          </div>
          <div className="p-5 rounded-2xl bg-white dark:bg-gray-900/80 border border-slate-200 dark:border-gray-800 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-500/20 flex items-center justify-center">
              <User size={20} className="text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">Lv. {user.level}</p>
              <p className="text-slate-400 dark:text-gray-500 text-xs">{t('profile.builderLevel')}</p>
            </div>
          </div>
          <div className="p-5 rounded-2xl bg-white dark:bg-gray-900/80 border border-slate-200 dark:border-gray-800 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-500/20 flex items-center justify-center">
              <BookOpen size={20} className="text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{user.completedCourses.length}</p>
              <p className="text-slate-400 dark:text-gray-500 text-xs">{t('profile.coursesDone')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
