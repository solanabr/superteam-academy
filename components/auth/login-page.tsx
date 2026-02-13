'use client';

import bs58 from 'bs58';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useAuth } from '@/components/auth/auth-provider';
import { useI18n } from '@/components/i18n/i18n-provider';
import { WalletConnectButton } from '@/components/wallet/wallet-connect-button';
import { trackEvent } from '@/lib/analytics';

type SocialProvider = 'google' | 'github';

export function LoginPage(): JSX.Element {
  const { dictionary } = useI18n();
  const { publicKey, signMessage } = useWallet();
  const { authenticated, loading, startOAuthFlow, requestWalletChallenge, walletSignIn, credentialsSignIn } = useAuth();
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [status, setStatus] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const isBusy = submitting || loading;

  const walletAddress = useMemo(() => {
    if (!publicKey) {
      return null;
    }

    const full = publicKey.toBase58();
    return `${full.slice(0, 4)}...${full.slice(-4)}`;
  }, [publicKey]);

  function handleSocial(provider: SocialProvider): void {
    setStatus(
      dictionary.login.socialStarting.replace(
        '{provider}',
        provider === 'google' ? dictionary.accountLinking.googleLabel : dictionary.accountLinking.githubLabel
      )
    );

    trackEvent('auth_provider_clicked', { provider, flow: 'login' });
    startOAuthFlow(provider, 'signin', '/dashboard');
  }

  async function handleWalletLogin(): Promise<void> {
    setSubmitting(true);

    if (!publicKey) {
      setStatus(dictionary.register.walletNotConnected);
      setSubmitting(false);
      return;
    }

    if (!signMessage) {
      setStatus(dictionary.login.walletSignerUnavailable);
      setSubmitting(false);
      return;
    }

    try {
      const address = publicKey.toBase58();
      const message = await requestWalletChallenge(address, 'signin', '/dashboard');
      const signatureBytes = await signMessage(new TextEncoder().encode(message));
      const result = await walletSignIn({
        walletAddress: address,
        message,
        signature: bs58.encode(signatureBytes)
      });

      if (!result.ok) {
        setStatus(dictionary.login.walletSignInFailed);
        setSubmitting(false);
        return;
      }

      setStatus(dictionary.login.loginSuccess);
      window.location.href = result.redirectUrl ?? '/dashboard';
    } catch {
      setStatus(dictionary.login.walletSignInFailed);
      setSubmitting(false);
    }
  }

  async function handleCredentialsLogin(): Promise<void> {
    setSubmitting(true);

    if (!email.trim() || !password.trim()) {
      setStatus(dictionary.login.fillFieldsError);
      setSubmitting(false);
      return;
    }

    try {
      const result = await credentialsSignIn({
        email: email.trim(),
        password,
        callbackUrl: '/dashboard'
      });

      if (!result.ok) {
        setStatus(dictionary.login.credentialsSignInFailed);
        setSubmitting(false);
        return;
      }

      setStatus(dictionary.login.loginSuccess);
      window.location.href = result.redirectUrl ?? '/dashboard';
    } catch {
      setStatus(dictionary.login.credentialsSignInFailed);
      setSubmitting(false);
    }
  }

  return (
    <div data-testid="login-page" className="mx-auto grid w-full max-w-6xl gap-5 lg:grid-cols-[1.25fr_1fr]">
      <section data-testid="login-form-panel" className="panel relative space-y-4 overflow-hidden">
        <div className="absolute -right-20 -top-16 h-44 w-44 rounded-full bg-primary/12 blur-3xl" />
        <header className="space-y-2">
          <p className="chip w-fit border-accent/30 bg-accent/10 text-accent">{dictionary.login.onboardingBadge}</p>
          <h1 className="text-3xl font-extrabold">{dictionary.actions.signIn}</h1>
          <p className="text-sm text-foreground/75">{dictionary.login.intro}</p>
        </header>

        <label className="space-y-1 block">
          <span className="text-xs font-medium text-foreground/70">{dictionary.login.emailLabel}</span>
          <input
            data-testid="login-email-input"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="input-field"
            placeholder={dictionary.login.emailPlaceholder}
          />
        </label>

        <label className="space-y-1 block">
          <span className="text-xs font-medium text-foreground/70">{dictionary.login.passwordLabel}</span>
          <input
            data-testid="login-password-input"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="input-field"
            placeholder={dictionary.login.passwordPlaceholder}
          />
        </label>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void handleCredentialsLogin()}
            disabled={isBusy}
            data-testid="login-submit-button"
            className="btn-primary disabled:opacity-60"
          >
            {submitting ? dictionary.login.processing : dictionary.login.credentialsLogin}
          </button>

          {authenticated ? (
            <Link href="/dashboard" className="btn-secondary">
              {dictionary.register.openDashboard}
            </Link>
          ) : null}
        </div>

        {status ? <p data-testid="login-status" className="panel-soft text-sm text-foreground/80">{status}</p> : null}
      </section>

      <aside data-testid="login-auth-panel" className="panel space-y-4">
        <h2 className="text-lg font-semibold">{dictionary.login.authMethodsTitle}</h2>

        <div className="panel-soft space-y-2 bg-background/45">
          <p className="text-xs text-foreground/70">{dictionary.register.walletRequiredLabel}</p>
          <WalletConnectButton className="!h-10 !w-full !justify-center !rounded-xl !bg-primary !text-xs !font-semibold !text-primary-foreground !shadow-sm" />
          <p className="text-xs text-foreground/70">
            {walletAddress
              ? `${dictionary.register.walletConnectedPrefix}: ${walletAddress}`
              : dictionary.register.walletNotConnected}
          </p>
          <button
            type="button"
            onClick={() => void handleWalletLogin()}
            disabled={isBusy}
            data-testid="login-wallet-submit-button"
            className="btn-primary w-full disabled:opacity-60"
          >
            {submitting ? dictionary.login.processing : dictionary.login.walletLogin}
          </button>
        </div>

        <button
          type="button"
          onClick={() => handleSocial('google')}
          disabled={isBusy}
          className="btn-secondary w-full disabled:opacity-60"
        >
          {dictionary.register.googleButton}
        </button>

        <button
          type="button"
          onClick={() => handleSocial('github')}
          disabled={isBusy}
          className="btn-secondary w-full disabled:opacity-60"
        >
          {dictionary.register.githubButton}
        </button>

        <p className="text-xs text-foreground/70">
          {dictionary.login.noAccountHint}{' '}
          <Link href="/register" className="font-semibold text-primary underline">
            {dictionary.login.goToRegister}
          </Link>
        </p>
      </aside>
    </div>
  );
}
