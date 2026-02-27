'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { AuthSignIn } from '@/components/AuthSignIn';

export function SettingsAccount() {
  const { publicKey } = useWallet();

  return (
    <div className="mt-4 space-y-6">
      <div>
        <p className="text-caption font-medium text-[rgb(var(--text-muted))]">Connected wallet</p>
        {publicKey ? (
          <p className="mt-1 font-mono text-body text-[rgb(var(--text))] break-all">
            {publicKey.toBase58()}
          </p>
        ) : (
          <p className="mt-1 text-body text-[rgb(var(--text-muted))]">Not connected. Use the header button to connect.</p>
        )}
        <p className="text-caption mt-1 text-[rgb(var(--text-subtle))]">
          Wallet is required to enroll, track progress, and receive credentials.
        </p>
      </div>
      <div>
        <p className="text-caption font-medium text-[rgb(var(--text-muted))]">Google / GitHub</p>
        <div className="mt-2">
          <AuthSignIn />
        </div>
      </div>
    </div>
  );
}
