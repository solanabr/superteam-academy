'use client';

import { signIn } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';

export default function SignInPage() {
  const t = useTranslations('auth');

  return (
    <div className="container flex min-h-[60vh] items-center justify-center">
      <div className="mx-auto w-full max-w-sm space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold">{t('signIn')}</h1>
        </div>

        <div className="space-y-3">
          <Button
            variant="solana"
            className="w-full"
            onClick={() => signIn('solana-wallet')}
          >
            {t('connectWallet')}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                {t('orContinueWith')}
              </span>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={() => signIn('google')}
          >
            {t('signInWith', { provider: 'Google' })}
          </Button>

          <Button
            variant="outline"
            className="w-full"
            onClick={() => signIn('github')}
          >
            {t('signInWith', { provider: 'GitHub' })}
          </Button>
        </div>
      </div>
    </div>
  );
}
