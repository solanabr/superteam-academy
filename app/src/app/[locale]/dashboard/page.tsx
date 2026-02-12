'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { createStubLearningProgressService } from '@/lib/stub-learning-progress';
import { levelFromXP } from '@/lib/utils';
import { BookOpen, Flame, Medal, Sparkles } from 'lucide-react';

export default function DashboardPage() {
  const t = useTranslations('dashboard');
  const { publicKey } = useWallet();
  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState({ currentStreak: 0, longestStreak: 0 });

  const userId = publicKey?.toBase58() ?? 'anonymous';

  useEffect(() => {
    const svc = createStubLearningProgressService();
    svc.getXP(userId).then(setXp);
    svc.getStreak(userId).then(setStreak);
  }, [userId]);

  const level = levelFromXP(xp);
  const nextLevelXP = (level + 1) ** 2 * 100;
  const progressInLevel = xp - level * level * 100;
  const progressNeeded = nextLevelXP - level * level * 100;
  const progressPct = progressNeeded > 0 ? (progressInLevel / progressNeeded) * 100 : 0;

  return (
    <div className="container mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
      {!publicKey ? (
        <div className="mt-10 rounded-2xl border border-border bg-card/50 p-8 text-center">
          <p className="text-muted-foreground">Connect your wallet to see your progress and earn XP.</p>
          <p className="mt-2 text-sm text-muted-foreground">Use the wallet button in the header. Progress is saved locally in this demo.</p>
        </div>
      ) : (
        <>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">{t('xpBalance')}</span>
              </div>
              <p className="mt-2 text-2xl font-bold">{xp}</p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Medal className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">{t('level')}</span>
              </div>
              <p className="mt-2 text-2xl font-bold">{level}</p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Flame className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">{t('streak')}</span>
              </div>
              <p className="mt-2 text-2xl font-bold">{streak.currentStreak} days</p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <span className="text-sm font-medium text-muted-foreground">{t('achievements')}</span>
              <p className="mt-2 text-lg text-muted-foreground">—</p>
            </div>
          </div>
          <section className="mt-12 rounded-2xl border border-border bg-card/50 p-6">
            <h2 className="text-xl font-semibold">{t('currentCourses')}</h2>
            <p className="mt-1 text-muted-foreground">Enroll in a course from the catalog to start earning XP.</p>
            <Link href="/courses">
              <Button className="mt-4 gap-2 rounded-xl" size="lg">
                <BookOpen className="h-4 w-4" />
                {t('recommended')}
              </Button>
            </Link>
          </section>
        </>
      )}
    </div>
  );
}
