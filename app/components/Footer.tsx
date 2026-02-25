'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { GraduationCap, Github, Twitter, Globe } from 'lucide-react';

export default function Footer() {
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'pt-BR';
  const t = useTranslations('nav');

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
              {locale === 'en'
                ? 'Learn Solana & Web3 with verifiable on-chain credentials.'
                : locale === 'es'
                  ? 'Aprende Solana y Web3 con credenciales on-chain verificables.'
                  : 'Aprenda Solana & Web3 com credenciais on-chain verificáveis.'}
            </p>
            <div className="flex gap-3">
              <a href="https://github.com/superteambr" className="text-gray-500 hover:text-purple-400 transition-colors" aria-label="GitHub">
                <Github className="h-5 w-5" />
              </a>
              <a href="https://twitter.com/SuperteamBR" className="text-gray-500 hover:text-purple-400 transition-colors" aria-label="Twitter">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="https://superteam.fun/brasil" className="text-gray-500 hover:text-purple-400 transition-colors" aria-label="Website">
                <Globe className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Learn */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-white uppercase tracking-wider">
              {locale === 'en' ? 'Learn' : locale === 'es' ? 'Aprender' : 'Aprender'}
            </h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link href={`/${locale}/cursos`} className="hover:text-purple-400 transition-colors">{t('courses')}</Link></li>
              <li><Link href={`/${locale}/cursos?level=iniciante`} className="hover:text-purple-400 transition-colors">
                {locale === 'en' ? 'For Beginners' : locale === 'es' ? 'Para Principiantes' : 'Para Iniciantes'}
              </Link></li>
              <li><Link href={`/${locale}/cursos?track=DeFi`} className="hover:text-purple-400 transition-colors">DeFi</Link></li>
              <li><Link href={`/${locale}/cursos?track=NFTs`} className="hover:text-purple-400 transition-colors">NFTs & Metaplex</Link></li>
              <li><Link href={`/${locale}/cursos?track=Anchor`} className="hover:text-purple-400 transition-colors">Anchor Framework</Link></li>
            </ul>
          </div>

          {/* Community */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-white uppercase tracking-wider">
              {locale === 'en' ? 'Community' : 'Comunidade'}
            </h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link href={`/${locale}/classificacao`} className="hover:text-purple-400 transition-colors">{t('leaderboard')}</Link></li>
              <li><a href="https://superteam.fun/brasil" className="hover:text-purple-400 transition-colors">Superteam Brasil</a></li>
              <li><a href="https://discord.gg/superteambr" className="hover:text-purple-400 transition-colors">Discord</a></li>
              <li><a href="https://twitter.com/SuperteamBR" className="hover:text-purple-400 transition-colors">Twitter / X</a></li>
            </ul>
          </div>

          {/* Platform */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-white uppercase tracking-wider">
              {locale === 'en' ? 'Platform' : 'Plataforma'}
            </h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link href={`/${locale}/painel`} className="hover:text-purple-400 transition-colors">{t('dashboard')}</Link></li>
              <li><Link href={`/${locale}/configuracoes`} className="hover:text-purple-400 transition-colors">{t('settings')}</Link></li>
              <li><a href="https://solana.com" className="hover:text-purple-400 transition-colors">Solana Network</a></li>
              <li><a href="https://explorer.solana.com" className="hover:text-purple-400 transition-colors">Solana Explorer</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-gray-800 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-500">
            &copy; {new Date().getFullYear()} Superteam Academy.{' '}
            {locale === 'en' ? 'Built on Solana.' : locale === 'es' ? 'Construido en Solana.' : 'Construído na Solana.'}
          </p>
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <span>Powered by</span>
            <span className="text-purple-400 font-medium">Superteam Brasil</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
