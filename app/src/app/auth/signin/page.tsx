'use client';

import Link from 'next/link';
import { useAuth } from '@/components/providers';
import { useTranslation } from '@/hooks/use-translation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { LoadingOverlay } from '@/components/ui/logo-loader';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { Loader2, Wallet, Chrome, Github } from 'lucide-react';

function SignInContent() {
  const {
    signInWithGoogle,
    signInWithGitHub,
    signInWithWallet,
    walletConnecting,
    isLoading,
    googleLoading,
    githubLoading,
    walletLoading,
  } = useAuth();
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
  const error = searchParams.get('error');

  const isAnyAuthInProgress = googleLoading || githubLoading || walletLoading;

  return (
    <>
      {/* Loading Overlay when any auth is in progress */}
      {isAnyAuthInProgress && (
        <LoadingOverlay
          message={
            walletLoading
              ? t('auth.signin.connecting')
              : googleLoading
                ? t('auth.signin.redirectingGoogle')
                : t('auth.signin.redirectingGitHub')
          }
          size="2xl"
        />
      )}

      <Card className="w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">{t('auth.signin.title')}</CardTitle>
          <CardDescription>{t('auth.signin.subtitle')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-500 dark:bg-red-950">
              {error === 'OAuthSignin' && t('auth.error.oauthSignin')}
              {error === 'OAuthCallback' && t('auth.error.oauthCallback')}
              {error === 'CredentialsSignin' && t('auth.signin.invalidCredentials')}
              {error === 'SessionRequired' && t('auth.error.sessionCallback')}
              {!['OAuthSignin', 'OAuthCallback', 'CredentialsSignin', 'SessionRequired'].includes(
                error
              ) && t('common.error')}
            </div>
          )}

          {/* Solana Wallet Sign In */}
          <Button
            variant="outline"
            className="h-12 w-full text-base"
            onClick={() => signInWithWallet(callbackUrl)}
            disabled={isAnyAuthInProgress}
          >
            {walletLoading || walletConnecting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                {walletConnecting && !walletLoading ? 'Connecting...' : 'Authenticating...'}
              </>
            ) : (
              <>
                <Wallet className="mr-2 h-5 w-5" />
                {t('auth.signin.withWallet')}
              </>
            )}
          </Button>

          <div className="relative">
            <Separator />
            <span className="bg-card text-muted-foreground absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-2 text-xs">
              OR
            </span>
          </div>

          {/* Google Sign In */}
          <Button
            variant="outline"
            className="h-12 w-full text-base"
            onClick={signInWithGoogle}
            disabled={isAnyAuthInProgress}
          >
            {googleLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                {t('auth.signin.redirectingGoogle')}
              </>
            ) : (
              <>
                <Chrome className="mr-2 h-5 w-5" />
                {t('auth.signin.withGoogle')}
              </>
            )}
          </Button>

          {/* GitHub Sign In */}
          <Button
            variant="outline"
            className="h-12 w-full text-base"
            onClick={signInWithGitHub}
            disabled={isAnyAuthInProgress}
          >
            {githubLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                {t('auth.signin.redirectingGitHub')}
              </>
            ) : (
              <>
                <Github className="mr-2 h-5 w-5" />
                {t('auth.signin.withGitHub')}
              </>
            )}
          </Button>

          <p className="text-muted-foreground pt-4 text-center text-xs">
            {t('auth.signin.terms')}{' '}
            <Link href="/terms" className="text-primary hover:underline">
              {t('auth.signin.termsLink')}
            </Link>
            ,{' '}
            <Link href="/privacy" className="text-primary hover:underline">
              {t('auth.signin.privacyLink')}
            </Link>
            .
          </p>
        </CardContent>
      </Card>
    </>
  );
}

import { LogoLoader } from '@/components/ui/logo-loader';

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center">
          <LogoLoader size="lg" message="Loading..." />
        </div>
      }
    >
      <SignInContent />
    </Suspense>
  );
}
