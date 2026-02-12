'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { createStubLearningProgressService } from '@/lib/stub-learning-progress';
import type { Credential } from '@/lib/types';

export function ProfileView() {
  const t = useTranslations('profile');
  const { publicKey } = useWallet();
  const [credentials, setCredentials] = useState<Credential[]>([]);

  useEffect(() => {
    if (!publicKey) return;
    const svc = createStubLearningProgressService();
    svc.getCredentials(publicKey).then(setCredentials);
  }, [publicKey]);

  if (!publicKey) {
    return (
      <div className="container py-8">
        <p className="text-muted-foreground">Connect your wallet to view your profile.</p>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t('editProfile')}</h1>
        <Link href="/settings">
          <Button variant="outline">Settings</Button>
        </Link>
      </div>
      <div className="mt-8 flex gap-8">
        <div className="h-20 w-20 rounded-full bg-muted" />
        <div>
          <p className="font-mono text-sm text-muted-foreground">{publicKey.toBase58().slice(0, 8)}…</p>
          <p className="mt-1 text-muted-foreground">Member</p>
        </div>
      </div>
      <section className="mt-12">
        <h2 className="text-xl font-semibold">{t('credentials')}</h2>
        {credentials.length === 0 ? (
          <p className="mt-2 text-muted-foreground">
            Complete courses to earn on-chain credentials (cNFTs). Stub: no credentials yet.
          </p>
        ) : (
          <ul className="mt-4 grid gap-4 sm:grid-cols-2">
            {credentials.map((c) => (
              <li key={c.id} className="rounded-lg border border-border bg-card p-4">
                <p className="font-medium">{c.trackName}</p>
                <p className="text-sm text-muted-foreground">
                  Level {c.currentLevel} · {c.coursesCompleted} courses
                </p>
                {c.verificationUrl && (
                  <a
                    href={c.verificationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-block text-sm text-primary"
                  >
                    Verify on Explorer
                  </a>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="mt-12">
        <h2 className="text-xl font-semibold">{t('completedCourses')}</h2>
        <p className="mt-2 text-muted-foreground">Completed courses will appear here.</p>
      </section>
    </div>
  );
}
