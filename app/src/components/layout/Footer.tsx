"use client";

import { useLang } from '@/contexts/LanguageContext';
import { Heart } from 'lucide-react';

export function Footer() {
  const { t } = useLang();
  return (
    <footer className="bg-white dark:bg-gray-950 border-t border-slate-200 dark:border-gray-800/50 transition-colors">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-green-400 to-yellow-400 flex items-center justify-center text-gray-950 font-bold text-[10px]">
              ST
            </div>
            <span className="text-slate-500 dark:text-gray-500 text-sm">
              Super<span className="text-slate-700 dark:text-gray-400">team</span> Academy
            </span>
          </div>
          <div className="flex items-center gap-1 text-slate-400 dark:text-gray-600 text-sm">
            <span>{t('footer.built')}</span>
            <Heart size={12} className="text-red-500" />
          </div>
          <p className="text-slate-400 dark:text-gray-600 text-xs">{t('footer.rights')}</p>
        </div>
      </div>
    </footer>
  );
}
