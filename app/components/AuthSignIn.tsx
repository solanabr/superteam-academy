'use client';

import { signIn, signOut, useSession } from 'next-auth/react';

export function AuthSignIn() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <span className="text-caption text-[rgb(var(--text-subtle))]">Checking session…</span>
    );
  }

  if (session?.user) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-caption text-[rgb(var(--text-muted))]">
          Signed in as <strong className="text-[rgb(var(--text))]">{session.user.email ?? session.user.name ?? 'Account'}</strong>
        </span>
        <button
          type="button"
          onClick={() => signOut()}
          className="rounded-md border border-border/50 bg-surface px-3 py-1.5 text-caption font-medium text-[rgb(var(--text))] transition hover:bg-surface-elevated focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => signIn('google', { callbackUrl: '/' })}
        className="inline-flex items-center gap-2 rounded-lg border border-border/50 bg-surface px-4 py-2 text-caption font-medium text-[rgb(var(--text))] transition hover:bg-surface-elevated focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:outline-none"
      >
        Sign in with Google
      </button>
      <button
        type="button"
        onClick={() => signIn('github', { callbackUrl: '/' })}
        className="inline-flex items-center gap-2 rounded-lg border border-border/50 bg-surface px-4 py-2 text-caption font-medium text-[rgb(var(--text))] transition hover:bg-surface-elevated focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:outline-none"
      >
        Sign in with GitHub
      </button>
      <p className="text-[12px] text-[rgb(var(--text-subtle))] w-full">
        Configure AUTH_GOOGLE_* and AUTH_GITHUB_* in .env to enable. Wallet is required for courses.
      </p>
    </div>
  );
}
