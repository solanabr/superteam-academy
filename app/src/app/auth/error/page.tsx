'use client';

import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/use-translation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { AlertTriangle } from 'lucide-react';

function ErrorContent() {
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  const error = searchParams.get('error');

  const errorMessages: Record<string, { title: string; description: string }> = {
    Configuration: {
      title: 'Configuration Error',
      description: 'There is a problem with the server configuration. Please contact support.',
    },
    AccessDenied: {
      title: 'Access Denied',
      description: 'You do not have permission to sign in.',
    },
    Verification: {
      title: 'Verification Error',
      description: 'The verification link may have expired or already been used.',
    },
    OAuthSignin: {
      title: 'Sign In Error',
      description: 'Could not start the sign-in process. Please try again.',
    },
    OAuthCallback: {
      title: 'Callback Error',
      description: 'There was a problem with the authentication callback.',
    },
    OAuthCreateAccount: {
      title: 'Account Creation Error',
      description: 'Could not create your account. The email may already be in use.',
    },
    EmailCreateAccount: {
      title: 'Account Creation Error',
      description: 'Could not create your account with this email.',
    },
    Callback: {
      title: 'Callback Error',
      description: 'There was a problem with the authentication process.',
    },
    OAuthAccountNotLinked: {
      title: 'Account Not Linked',
      description:
        'This email is already associated with another account. Sign in using the original method.',
    },
    SessionRequired: {
      title: 'Session Required',
      description: 'You need to be signed in to access this page.',
    },
    Default: {
      title: t('auth.error.title'),
      description: t('common.error'),
    },
  };

  const { title, description } = errorMessages[error || ''] || errorMessages.Default;

  return (
    <div className="bg-background flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
            <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle className="text-2xl font-bold text-red-600 dark:text-red-400">
            {title}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button asChild className="w-full">
            <Link href="/auth/signin">{t('common.retry')}</Link>
          </Button>
          <Button variant="outline" asChild className="w-full">
            <Link href="/">{t('nav.home')}</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

import { LogoLoader } from '@/components/ui/logo-loader';

export default function AuthErrorPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <LogoLoader size="lg" message={undefined} />
        </div>
      }
    >
      <ErrorContent />
    </Suspense>
  );
}
