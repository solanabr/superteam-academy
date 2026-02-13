'use client';

import bs58 from 'bs58';
import { useMemo, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useAuth } from '@/components/auth/auth-provider';
import { useI18n } from '@/components/i18n/i18n-provider';

type Provider = 'wallet' | 'google' | 'github';

export function AccountLinkingCard(): JSX.Element {
  const { dictionary } = useI18n();
  const { publicKey, signMessage } = useWallet();
  const { user, startOAuthFlow, requestWalletChallenge, linkWallet } = useAuth();
  const [status, setStatus] = useState<string>('');

  const linked = useMemo<Record<Provider, boolean>>(() => {
    const providers = user?.providers ?? [];
    return {
      wallet: Boolean(user?.walletAddress) || providers.includes('wallet'),
      google: providers.includes('google'),
      github: providers.includes('github')
    };
  }, [user]);

  function providerLabel(provider: Provider): string {
    if (provider === 'google') {
      return dictionary.accountLinking.googleLabel;
    }
    if (provider === 'github') {
      return dictionary.accountLinking.githubLabel;
    }
    return dictionary.accountLinking.walletLabel;
  }

  async function triggerOAuthLink(provider: 'google' | 'github'): Promise<void> {
    if (!user) {
      setStatus(dictionary.accountLinking.noRegistration);
      return;
    }

    setStatus(
      dictionary.register.socialStarting.replace('{provider}', providerLabel(provider))
    );
    startOAuthFlow(provider, 'link', '/settings');
  }

  async function handleWalletLink(): Promise<void> {
    if (!user) {
      setStatus(dictionary.accountLinking.noRegistration);
      return;
    }

    if (linked.wallet) {
      setStatus(dictionary.accountLinking.linked);
      return;
    }

    if (!publicKey || !signMessage) {
      setStatus(dictionary.accountLinking.connectWalletFirst);
      return;
    }

    try {
      const walletAddress = publicKey.toBase58();
      const message = await requestWalletChallenge(walletAddress, 'link', '/settings');
      const signatureBytes = await signMessage(new TextEncoder().encode(message));
      const result = await linkWallet({
        walletAddress,
        message,
        signature: bs58.encode(signatureBytes)
      });

      if (!result.ok) {
        setStatus(dictionary.accountLinking.walletLinkFailed);
        return;
      }

      const short = `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`;
      setStatus(dictionary.accountLinking.walletLinkedStatus.replace('{wallet}', short));
    } catch {
      setStatus(dictionary.accountLinking.walletLinkFailed);
    }
  }

  const providers: Array<{ id: Provider; label: string; required?: boolean }> = [
    { id: 'wallet', label: dictionary.accountLinking.walletLabel, required: true },
    { id: 'google', label: dictionary.accountLinking.googleLabel },
    { id: 'github', label: dictionary.accountLinking.githubLabel }
  ];

  return (
    <section className="panel space-y-3 p-4">
      <h3 className="text-sm font-semibold">{dictionary.accountLinking.title}</h3>
      <p className="text-xs text-foreground/70">{dictionary.accountLinking.subtitle}</p>

      <ul className="space-y-2">
        {providers.map((provider) => (
          <li key={provider.id} className="flex items-center justify-between rounded-xl border border-border/70 bg-background/45 p-3">
            <div>
              <p className="text-sm font-medium">{provider.label}</p>
              {provider.required ? <p className="text-xs text-accent">{dictionary.accountLinking.requiredForCredentials}</p> : null}
            </div>
            <button
              type="button"
              onClick={() => void (async (): Promise<void> => {
                if (provider.id === 'wallet') {
                  await handleWalletLink();
                  return;
                }

                await triggerOAuthLink(provider.id);
              })()}
              disabled={linked[provider.id]}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                linked[provider.id]
                  ? 'border border-emerald-500/35 bg-emerald-500/12 text-emerald-400'
                  : 'bg-primary text-primary-foreground'
              }`}
            >
              {linked[provider.id] ? dictionary.accountLinking.linked : dictionary.accountLinking.linkNow}
            </button>
          </li>
        ))}
      </ul>

      {status ? <p className="text-xs text-foreground/70">{status}</p> : null}
    </section>
  );
}
