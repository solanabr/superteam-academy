'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';

export function Footer() {
  const t = useTranslations('footer');

  return (
    <footer className="border-t bg-card">
      <div className="container py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="space-y-3">
            <span className="bg-gradient-to-r from-solana-purple to-solana-green bg-clip-text text-lg font-bold text-transparent">
              Superteam Academy
            </span>
            <p className="text-sm text-muted-foreground">
              {t('description')}
            </p>
          </div>

          {/* Resources */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">{t('resources')}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/courses" className="hover:text-foreground">{t('docs')}</Link></li>
              <li><Link href="#" className="hover:text-foreground">{t('blog')}</Link></li>
            </ul>
          </div>

          {/* Community */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">{t('community')}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="https://twitter.com/SuperteamBR" target="_blank" rel="noopener noreferrer" className="hover:text-foreground">{t('twitter')}</a></li>
              <li><a href="https://discord.gg/superteam" target="_blank" rel="noopener noreferrer" className="hover:text-foreground">{t('discord')}</a></li>
              <li><a href="https://github.com/solanabr/superteam-academy" target="_blank" rel="noopener noreferrer" className="hover:text-foreground">{t('github')}</a></li>
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">{t('legal')}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="#" className="hover:text-foreground">{t('terms')}</Link></li>
              <li><Link href="#" className="hover:text-foreground">{t('privacy')}</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t pt-8 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Superteam Brazil. {t('rights')}
        </div>
      </div>
    </footer>
  );
}
