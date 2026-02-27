'use client';

import Link from 'next/link';
import { useWallet } from '@solana/wallet-adapter-react';
import { useState, useEffect } from 'react';
import { learningProgressService, xpToLevel } from '@/lib/services';

export function XPBadge() {
  const { publicKey } = useWallet();
  const [xp, setXp] = useState<number | null>(null);

  useEffect(() => {
    if (!publicKey) {
      setXp(null);
      return;
    }
    learningProgressService.getXPBalance(publicKey.toBase58()).then((b) => setXp(b.xp));
  }, [publicKey]);

  if (!publicKey || xp === null) return null;

  const level = xpToLevel(xp);

  return (
    <Link
      href="/dashboard"
      className="flex items-center gap-2 rounded-lg border border-border/50 bg-surface px-3 py-1.5 text-caption font-medium text-[rgb(var(--text))] transition hover:border-accent/40"
      title="View dashboard"
    >
      <span className="font-semibold text-accent">{xp} XP</span>
      <span className="text-[rgb(var(--text-subtle))]">Lv.{level}</span>
    </Link>
  );
}
