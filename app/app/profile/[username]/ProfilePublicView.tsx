'use client';

import Link from 'next/link';

interface Props {
  username: string;
}

/**
 * Public profile view for /profile/[username].
 * Stub: when usernames/wallets are indexed, fetch profile by username or wallet and show avatar, bio, credentials, achievements, completed courses.
 */
export function ProfilePublicView({ username }: Props) {
  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-border/50 bg-surface p-6">
        <h1 className="text-title font-semibold text-[rgb(var(--text))]">
          Public profile
        </h1>
        <p className="text-body mt-2 text-[rgb(var(--text-muted))]">
          Viewing profile for <strong className="text-[rgb(var(--text))]">{username}</strong>
        </p>
        <p className="text-caption mt-4 text-[rgb(var(--text-subtle))]">
          When the platform supports usernames or wallet-based public profiles, this page will show avatar, bio, skill radar, achievements, on-chain credentials, and completed courses. For now, connect your wallet and visit your own <Link href="/profile" className="text-accent hover:underline">Profile</Link> or check the <Link href="/leaderboard" className="text-accent hover:underline">Leaderboard</Link>.
        </p>
        <div className="mt-6 flex gap-3">
          <Link
            href="/profile"
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-[rgb(3_7_18)] transition hover:bg-accent-hover focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            My profile
          </Link>
          <Link
            href="/leaderboard"
            className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-[rgb(var(--text))] transition hover:bg-surface-elevated focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            Leaderboard
          </Link>
        </div>
      </section>
    </div>
  );
}
