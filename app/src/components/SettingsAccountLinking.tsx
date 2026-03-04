"use client";

import { useState } from "react";
import { useSession, signIn } from "next-auth/react";
import { useWallet } from "@solana/wallet-adapter-react";

export function SettingsAccountLinking() {
  const { data: session } = useSession();
  const { connected, publicKey } = useWallet();
  const [walletLinked, setWalletLinked] = useState(false);

  const googleLinked = Boolean(session?.user?.email);

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="text-sm font-semibold">Account linking</div>
      <p className="mt-2 text-sm text-zinc-600">
        Link Google + wallet for unified profile identity.
      </p>

      <div className="mt-4 space-y-3 text-sm">
        <div className="rounded-xl border border-zinc-200 p-3">
          <div className="font-medium">Google account</div>
          <div className="mt-1 text-zinc-600">
            {googleLinked ? `Linked: ${session?.user?.email}` : "Not linked"}
          </div>
          {!googleLinked ? (
            <button
              onClick={() => signIn("google", { callbackUrl: "/settings" })}
              className="mt-2 rounded-lg bg-zinc-900 px-3 py-1.5 text-xs text-white"
            >
              Link Google
            </button>
          ) : null}
        </div>

        <div className="rounded-xl border border-zinc-200 p-3">
          <div className="font-medium">Wallet account</div>
          <div className="mt-1 text-zinc-600">
            {connected && publicKey ? `Connected: ${publicKey.toBase58()}` : "Not connected"}
          </div>
          <button
            disabled={!connected}
            onClick={() => setWalletLinked(Boolean(connected))}
            className="mt-2 rounded-lg bg-zinc-900 px-3 py-1.5 text-xs text-white disabled:cursor-not-allowed disabled:bg-zinc-300"
          >
            {walletLinked ? "Wallet linked" : "Link connected wallet"}
          </button>
        </div>
      </div>
    </div>
  );
}
