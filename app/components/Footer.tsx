'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { GraduationCap, Github, Twitter, Globe } from 'lucide-react';
import { localePath } from '@/lib/paths';

export default function Footer() {
  const locale = useLocale();
  const tNav = useTranslations('nav');
  const tFooter = useTranslations('footer');

  return (
    <footer className="border-t border-gray-800 bg-gray-950">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600">
                <GraduationCap className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-white">Superteam Academy</span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              {tFooter('brand_description')}
            </p>
            <div className="flex gap-2">
              <a href="https://github.com/superteambr" className="flex items-center justify-center w-9 h-9 rounded-lg text-gray-300 hover:text-purple-300 hover:bg-gray-800 transition-colors" aria-label="GitHub">
                <Github className="h-5 w-5" />
              </a>
              <a href="https://twitter.com/SuperteamBR" className="flex items-center justify-center w-9 h-9 rounded-lg text-gray-300 hover:text-purple-300 hover:bg-gray-800 transition-colors" aria-label="Twitter">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="https://superteam.fun/brasil" className="flex items-center justify-center w-9 h-9 rounded-lg text-gray-300 hover:text-purple-300 hover:bg-gray-800 transition-colors" aria-label="Website">
                <Globe className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Learn */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-white uppercase tracking-wider">
              {tFooter('section_learn')}
            </h3>
            <ul className="space-y-0.5 text-sm text-gray-300">
              <li><Link href={localePath(locale, '/courses')} className="block py-2 hover:text-purple-300 transition-colors">{tNav('courses')}</Link></li>
              <li><Link href={localePath(locale, '/challenges')} className="block py-2 hover:text-purple-300 transition-colors">{tFooter('challenges')}</Link></li>
              <li><Link href={`${localePath(locale, '/courses')}?level=beginner`} className="block py-2 hover:text-purple-300 transition-colors">
                {tFooter('for_beginners')}
              </Link></li>
              <li><Link href={`${localePath(locale, '/courses')}?track=DeFi`} className="block py-2 hover:text-purple-300 transition-colors">DeFi</Link></li>
              <li><Link href={`${localePath(locale, '/courses')}?track=NFTs`} className="block py-2 hover:text-purple-300 transition-colors">NFTs & Metaplex</Link></li>
            </ul>
          </div>

          {/* Community */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-white uppercase tracking-wider">
              {tFooter('section_community')}
            </h3>
            <ul className="space-y-0.5 text-sm text-gray-300">
              <li><Link href={localePath(locale, '/leaderboard')} className="block py-2 hover:text-purple-300 transition-colors">{tNav('leaderboard')}</Link></li>
              <li><a href="https://superteam.fun/brasil" className="block py-2 hover:text-purple-300 transition-colors">Superteam Brasil</a></li>
              <li><a href="https://discord.gg/superteambr" className="block py-2 hover:text-purple-300 transition-colors">Discord</a></li>
              <li><a href="https://twitter.com/SuperteamBR" className="block py-2 hover:text-purple-300 transition-colors">Twitter / X</a></li>
            </ul>
          </div>

          {/* Platform */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-white uppercase tracking-wider">
              {tFooter('section_platform')}
            </h3>
            <ul className="space-y-0.5 text-sm text-gray-300">
              <li><Link href={localePath(locale, '/dashboard')} className="block py-2 hover:text-purple-300 transition-colors">{tNav('dashboard')}</Link></li>
              <li><Link href={localePath(locale, '/settings')} className="block py-2 hover:text-purple-300 transition-colors">{tNav('settings')}</Link></li>
              <li><a href="https://solana.com" className="block py-2 hover:text-purple-300 transition-colors">Solana Network</a></li>
              <li><a href="https://explorer.solana.com" className="block py-2 hover:text-purple-300 transition-colors">Solana Explorer</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-gray-800 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-400">
            &copy; {new Date().getFullYear()} Superteam Academy.{' '}
            {tFooter('built_on_solana')}
          </p>
          <div className="flex items-center gap-1 text-sm text-gray-400">
            <span>{tFooter('powered_by')}</span>
            <span className="text-purple-400 font-medium">Superteam Brasil</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
