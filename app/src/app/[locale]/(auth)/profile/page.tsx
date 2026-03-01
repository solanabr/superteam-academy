"use client";

import { useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useRouter } from "@/i18n/navigation";

export default function ProfileRedirect() {
  const { publicKey, connected } = useWallet();
  const { setVisible } = useWalletModal();
  const router = useRouter();

  useEffect(() => {
    if (publicKey) {
      router.push({ pathname: "/profile/[username]", params: { username: publicKey.toBase58() } });
    }
  }, [publicKey, router]);

  if (!connected) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-4">
        <span className="text-4xl">◎</span>
        <h2 className="font-mono text-xl font-bold text-foreground">View your profile</h2>
        <p className="text-sm text-muted-foreground text-center max-w-xs">
          Connect your wallet to access your profile page.
        </p>
        <button
          onClick={() => setVisible(true)}
          className="mt-2 bg-[#14F195] text-black font-mono font-semibold px-6 py-2.5 rounded-full hover:bg-accent-dim transition-colors"
        >
          Connect Wallet
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-muted-foreground font-mono text-sm">Redirecting...</div>
    </div>
  );
}
