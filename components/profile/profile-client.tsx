'use client';

import { useEffect, useMemo, useState } from 'react';
import { PublicKey } from '@solana/web3.js';
import { useWallet } from '@solana/wallet-adapter-react';
import Link from 'next/link';
import { useI18n } from '@/components/i18n/i18n-provider';
import { CredentialCard } from '@/components/profile/credential-card';
import { SkillRadar } from '@/components/profile/skill-radar';
import {
  getRegistrationRecord,
  REGISTRATION_CHANGED_EVENT
} from '@/lib/auth/registration-storage';
import { learningProgressService } from '@/lib/services';
import { Credential, UserProfile } from '@/lib/types';

export function ProfileClient(): JSX.Element | null {
  const { dictionary } = useI18n();
  const { publicKey } = useWallet();
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [ready, setReady] = useState<boolean>(false);
  const [registration, setRegistration] = useState<ReturnType<typeof getRegistrationRecord>>(null);

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

  const walletAddress = publicKey?.toBase58() ?? registration?.walletAddress;
  const hasAccount = Boolean(registration);
  const profile = useMemo<UserProfile>(() => {
    const createdAt = registration?.createdAt
      ? registration.createdAt.split('T')[0]
      : new Date().toISOString().split('T')[0];
    const displayName = registration?.name ?? dictionary.profile.title;
    const username = registration?.username ?? dictionary.profile.title.toLowerCase();
    const bio = registration?.bio && registration.bio.trim().length > 0
      ? registration.bio
      : dictionary.profile.registeredBio;

    return {
      id: registration?.id ?? username,
      username,
      displayName,
      bio,
      avatarUrl: '/avatars/default.png',
      joinedAt: createdAt,
      walletAddress,
      social: {},
      skills: [
        { name: 'Rust', value: 0 },
        { name: 'Anchor', value: 0 },
        { name: 'Frontend', value: 0 },
        { name: 'Security', value: 0 },
        { name: 'Protocol Design', value: 0 }
      ],
      badges: [],
      completedCourseIds: [],
      publicProfile: registration?.publicProfile ?? true
    };
  }, [dictionary.profile.registeredBio, dictionary.profile.title, registration, walletAddress]);

  useEffect(() => {
    if (!hasAccount) {
      setLoading(false);
      setCredentials([]);
      return;
    }

    if (!walletAddress) {
      setLoading(false);
      setCredentials([]);
      return;
    }
    const resolvedWalletAddress = walletAddress;

    let active = true;

    async function load(): Promise<void> {
      setLoading(true);
      let nextCredentials: Credential[] = [];

      try {
        const wallet = publicKey ?? new PublicKey(resolvedWalletAddress);
        nextCredentials = await learningProgressService.getCredentials(wallet);
      } catch {
        nextCredentials = [];
      }

      if (!active) {
        return;
      }

      setCredentials(nextCredentials);
      setLoading(false);
    }

    void load();

    return () => {
      active = false;
    };
  }, [publicKey, walletAddress, hasAccount]);

  if (!ready) {
    return null;
  }

  if (!hasAccount) {
    return (
      <div className="panel mx-auto max-w-2xl space-y-4">
        <h1 className="text-3xl font-extrabold">{dictionary.profile.title}</h1>
        <p className="text-sm text-foreground/75">{dictionary.profile.noAccountDesc}</p>
        <div className="flex gap-2">
          <Link href="/register" className="btn-primary">
            {dictionary.actions.goToRegister}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="panel relative overflow-hidden">
        <div className="absolute -right-16 top-0 h-36 w-36 rounded-full bg-accent/12 blur-3xl" />
        <h1 className="text-3xl font-extrabold">{profile.displayName}</h1>
        <p className="mt-2 text-sm text-foreground/75">{profile.bio}</p>
        <p className="mt-2 text-xs text-foreground/60">
          {dictionary.profile.joinedOn} {profile.joinedAt}
        </p>
        <p className="mt-1 text-xs text-foreground/60">
          {publicKey
            ? `${dictionary.common.connectedWallet}: ${publicKey.toBase58().slice(0, 4)}...${publicKey
                .toBase58()
                .slice(-4)}`
            : registration?.walletAddress
              ? `${dictionary.profile.registeredWalletPrefix}: ${registration.walletAddress.slice(0, 4)}...${registration.walletAddress.slice(-4)}`
              : dictionary.profile.connectWalletHint}
        </p>
      </header>

      <SkillRadar profile={profile} />

      <section className="panel space-y-3 p-5">
        <h2 className="text-xl font-semibold">{dictionary.profile.onchainCredentials}</h2>
        {loading ? <p className="text-sm text-foreground/70">{dictionary.profile.loadingCredentials}</p> : null}

        <div className="grid gap-3 md:grid-cols-2">
          {credentials.map((credential) => (
            <CredentialCard key={credential.id} credential={credential} />
          ))}
        </div>
        {!loading && credentials.length === 0 ? (
          <p className="text-sm text-foreground/70">{dictionary.profile.noCredentials}</p>
        ) : null}
      </section>
    </div>
  );
}
