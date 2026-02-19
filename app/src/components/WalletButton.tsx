// app/src/components/WalletButton.tsx
"use client";

import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";

export default function WalletButton() {
  const { publicKey, disconnect, connecting } = useWallet();
  const { setVisible } = useWalletModal();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Заглушка до полного монтирования клиента
  if (!mounted) {
    return (
      <button
        className="px-8 py-3 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white font-medium disabled:opacity-50 transition-all"
        disabled
      >
        Connect Wallet
      </button>
    );
  }

  const handleClick = () => {
    if (publicKey) {
      disconnect();
    } else {
      setVisible(true); // открываем модалку кошельков
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={connecting}
      className="px-8 py-3 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white font-medium transition-all flex items-center gap-2 disabled:opacity-50"
    >
      {publicKey ? (
        <>
          {publicKey.toBase58().slice(0, 4)}...
          {publicKey.toBase58().slice(-4)}
        </>
      ) : (
        "Connect Wallet"
      )}
    </button>
  );
}