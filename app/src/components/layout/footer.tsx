'use client';

import { useTranslations } from 'next-intl';
import { GraduationCap } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export function Footer() {
  const t = useTranslations('common');

  return (
    <footer className="border-t bg-background/50">
      <div className="container py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-solana-purple" />
            <span className="font-semibold">{t('appName')}</span>
          </div>

          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <a
              href="https://github.com/solanabr/superteam-academy"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              GitHub
            </a>
            <a
              href="https://superteam.fun"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              Superteam
            </a>
            <a
              href="https://solana.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              Solana
            </a>
          </div>

          <p className="text-xs text-muted-foreground">
            Built on Solana Devnet • Open Source
          </p>
        </div>
      </div>
    </footer>
  );
}
