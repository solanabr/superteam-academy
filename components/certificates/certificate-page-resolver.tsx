'use client';

import Link from 'next/link';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { useEffect, useMemo, useState } from 'react';
import { CertificatePageClient } from '@/components/certificates/certificate-page-client';
import { useI18n } from '@/components/i18n/i18n-provider';
import { getRegistrationRecord, REGISTRATION_CHANGED_EVENT } from '@/lib/auth/registration-storage';
import { learningProgressService } from '@/lib/services';
import { Credential } from '@/lib/types';

interface CertificatePageResolverProps {
  certificateId: string;
  walletHint?: string;
}

function safeWallet(value: string): string | null {
  try {
    return new PublicKey(value).toBase58();
  } catch {
    return null;
  }
}

export function CertificatePageResolver({
  certificateId,
  walletHint
}: CertificatePageResolverProps): JSX.Element | null {
  const { dictionary } = useI18n();
  const { publicKey } = useWallet();
  const [registration, setRegistration] = useState<ReturnType<typeof getRegistrationRecord>>(null);
  const [credential, setCredential] = useState<Credential | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [ready, setReady] = useState<boolean>(false);

  useEffect(() => {
    function syncRegistration(): void {
      setRegistration(getRegistrationRecord());
    }

    syncRegistration();
    setReady(true);
    window.addEventListener(REGISTRATION_CHANGED_EVENT, syncRegistration);

    return () => {
      window.removeEventListener(REGISTRATION_CHANGED_EVENT, syncRegistration);
    };
  }, []);

  const candidateWallets = useMemo<string[]>(() => {
    const set = new Set<string>();
    const hint = walletHint ? safeWallet(walletHint) : null;
    const connected = publicKey?.toBase58();
    const linked = registration?.walletAddress ? safeWallet(registration.walletAddress) : null;

    if (hint) {
      set.add(hint);
    }
    if (connected) {
      set.add(connected);
    }
    if (linked) {
      set.add(linked);
    }

    return [...set];
  }, [publicKey, registration?.walletAddress, walletHint]);

  useEffect(() => {
    if (!ready) {
      return;
    }

    if (candidateWallets.length === 0) {
      setCredential(null);
      setLoading(false);
      return;
    }

    let active = true;

    async function loadCredential(): Promise<void> {
      setLoading(true);
      let found: Credential | null = null;

      for (const wallet of candidateWallets) {
        try {
          const credentials = await learningProgressService.getCredentials(new PublicKey(wallet));
          const match = credentials.find((item) => item.id === certificateId);
          if (match) {
            found = match;
            break;
          }
        } catch {
          // Ignore invalid wallet candidate and continue lookup.
        }
      }

      if (!active) {
        return;
      }

      setCredential(found);
      setLoading(false);
    }

    void loadCredential();

    return () => {
      active = false;
    };
  }, [candidateWallets, certificateId, ready]);

  if (!ready) {
    return null;
  }

  if (loading) {
    return <p className="panel-soft text-sm text-foreground/70">{dictionary.certificate.loading}</p>;
  }

  if (!credential && candidateWallets.length === 0) {
    return (
      <div className="panel mx-auto max-w-2xl space-y-4">
        <h1 className="text-2xl font-extrabold">{dictionary.certificate.title}</h1>
        <p className="text-sm text-foreground/75">{dictionary.certificate.connectWalletOrLink}</p>
        <div className="flex flex-wrap gap-2">
          <Link href="/register" className="btn-primary">
            {dictionary.actions.goToRegister}
          </Link>
          <Link href="/settings" className="btn-secondary">
            {dictionary.nav.settings}
          </Link>
        </div>
      </div>
    );
  }

  if (!credential) {
    return (
      <div className="panel mx-auto max-w-2xl space-y-4">
        <h1 className="text-2xl font-extrabold">{dictionary.certificate.title}</h1>
        <p className="text-sm text-foreground/75">{dictionary.certificate.notFound}</p>
        <div className="flex flex-wrap gap-2">
          <Link href="/profile" className="btn-primary">
            {dictionary.certificate.openProfile}
          </Link>
        </div>
      </div>
    );
  }

  return <CertificatePageClient credential={credential} />;
}
