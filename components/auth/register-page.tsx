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

interface FormState {
  name: string;
  email: string;
  username: string;
  password: string;
}

const initialForm: FormState = {
  name: '',
  email: '',
  username: '',
  password: ''
};

export function RegisterPage(): JSX.Element {
  const { dictionary } = useI18n();
  const { publicKey, signMessage } = useWallet();
  const { authenticated, loading, startOAuthFlow, requestWalletChallenge, walletSignIn, logout } = useAuth();
  const [form, setForm] = useState<FormState>(initialForm);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [status, setStatus] = useState<string>('');

  const walletAddress = useMemo(() => {
    if (!publicKey) {
      return null;
    }

    const full = publicKey.toBase58();
    return `${full.slice(0, 4)}...${full.slice(-4)}`;
  }, [publicKey]);

  function updateField(field: keyof FormState, value: string): void {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSocial(provider: SocialProvider): void {
    setStatus(
      dictionary.register.socialStarting.replace(
        '{provider}',
        provider === 'google' ? dictionary.accountLinking.googleLabel : dictionary.accountLinking.githubLabel
      )
    );

    trackEvent('auth_provider_clicked', { provider });
    startOAuthFlow(provider, 'signin', '/dashboard');
  }

  async function handleCreateAccount(): Promise<void> {
    setSubmitting(true);

    if (!form.name || !form.email || !form.username) {
      setStatus(dictionary.register.fillFieldsError);
      setSubmitting(false);
      return;
    }

    if (!publicKey) {
      setStatus(dictionary.register.walletNotConnected);
      setSubmitting(false);
      return;
    }

    if (!signMessage) {
      setStatus(dictionary.register.walletSignerUnavailable);
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
        signature: bs58.encode(signatureBytes),
        name: form.name,
        email: form.email,
        username: form.username.toLowerCase(),
        password: form.password.trim() || undefined
      });

      if (!result.ok) {
        setStatus(dictionary.register.walletSignInFailed);
        setSubmitting(false);
        return;
      }

      trackEvent('auth_registration_started', {
        hasWallet: 1,
        username: form.username,
        providerCount: 1
      });

      setStatus(dictionary.register.registrationSuccess.replace('{username}', form.username));
      const target = result.redirectUrl ?? '/dashboard';
      window.location.href = target;
    } catch {
      setStatus(dictionary.register.walletSignInFailed);
      setSubmitting(false);
    }
  }

  async function handleSignOut(): Promise<void> {
    await logout();
    setStatus(dictionary.register.clearLocalStatus);
  }

  return (
    <div data-testid="register-page" className="mx-auto grid w-full max-w-6xl gap-5 lg:grid-cols-[1.25fr_1fr]">
      <section data-testid="register-form-panel" className="panel relative space-y-4 overflow-hidden">
        <div className="absolute -right-20 -top-16 h-44 w-44 rounded-full bg-primary/12 blur-3xl" />
        <header className="space-y-2">
          <p className="chip w-fit border-accent/30 bg-accent/10 text-accent">{dictionary.register.onboardingBadge}</p>
          <h1 className="text-3xl font-extrabold">{dictionary.actions.signUp}</h1>
          <p className="text-sm text-foreground/75">{dictionary.register.intro}</p>
        </header>

        <div className="grid gap-3 md:grid-cols-2">
          <label className="space-y-1">
            <span className="text-xs font-medium text-foreground/70">{dictionary.register.fullName}</span>
            <input
              data-testid="register-name-input"
              value={form.name}
              onChange={(event) => updateField('name', event.target.value)}
              className="input-field"
              placeholder={dictionary.register.fullName}
            />
          </label>

          <label className="space-y-1">
            <span className="text-xs font-medium text-foreground/70">{dictionary.register.username}</span>
            <input
              data-testid="register-username-input"
              value={form.username}
              onChange={(event) => updateField('username', event.target.value)}
              className="input-field"
              placeholder={dictionary.register.username}
            />
          </label>
        </div>

        <label className="space-y-1 block">
          <span className="text-xs font-medium text-foreground/70">{dictionary.register.email}</span>
          <input
            data-testid="register-email-input"
            type="email"
            value={form.email}
            onChange={(event) => updateField('email', event.target.value)}
            className="input-field"
            placeholder={dictionary.register.email}
          />
        </label>

        <label className="space-y-1 block">
          <span className="text-xs font-medium text-foreground/70">{dictionary.register.passwordLabel}</span>
          <input
            data-testid="register-password-input"
            type="password"
            value={form.password}
            onChange={(event) => updateField('password', event.target.value)}
            className="input-field"
            placeholder={dictionary.register.passwordLabel}
          />
          <p className="text-xs text-foreground/60">{dictionary.register.passwordOptionalHint}</p>
        </label>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void handleCreateAccount()}
            disabled={submitting || loading}
            data-testid="register-submit-button"
            className="btn-primary"
          >
            {submitting ? dictionary.register.processing : dictionary.register.createAccount}
          </button>

          {authenticated ? (
            <Link href="/dashboard" className="btn-secondary">
              {dictionary.register.openDashboard}
            </Link>
          ) : null}

          <button
            type="button"
            onClick={() => void handleSignOut()}
            data-testid="register-clear-button"
            className="btn-secondary"
          >
            {dictionary.register.clearLocalAccount}
          </button>
        </div>

        {status ? <p data-testid="register-status" className="panel-soft text-sm text-foreground/80">{status}</p> : null}
      </section>

      <aside data-testid="register-auth-panel" className="panel space-y-4">
        <h2 className="text-lg font-semibold">{dictionary.register.authMethodsTitle}</h2>

        <div className="panel-soft space-y-2 bg-background/45">
          <p className="text-xs text-foreground/70">{dictionary.register.walletRequiredLabel}</p>
          <WalletConnectButton className="!h-10 !w-full !justify-center !rounded-xl !bg-primary !text-xs !font-semibold !text-primary-foreground !shadow-sm" />
          <p className="text-xs text-foreground/70">
            {walletAddress
              ? `${dictionary.register.walletConnectedPrefix}: ${walletAddress}`
              : dictionary.register.walletNotConnected}
          </p>
        </div>

        <button
          type="button"
          onClick={() => handleSocial('google')}
          disabled={submitting || loading}
          className="btn-secondary w-full disabled:opacity-60"
        >
          {dictionary.register.googleButton}
        </button>

        <button
          type="button"
          onClick={() => handleSocial('github')}
          disabled={submitting || loading}
          className="btn-secondary w-full disabled:opacity-60"
        >
          {dictionary.register.githubButton}
        </button>

        <p className="text-xs text-foreground/70">{dictionary.register.afterRegistrationSettings}</p>
        <Link href="/login" className="text-xs font-semibold text-primary underline">
          {dictionary.actions.signIn}
        </Link>
      </aside>
    </div>
  );
}
