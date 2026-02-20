"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useTranslations } from "next-intl";
import { useWallets } from "@privy-io/react-auth/solana";

export function Footer() {
  const t = useTranslations("footer");
  const { wallets } = useWallets();
  const [clickCount, setClickCount] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isOpen, setIsOpen] = useState(false);

  const walletAddress = wallets?.[0]?.address;

  const handleHeartClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Hide and seek game
    if (clickCount < 4) {
      setClickCount(c => c + 1);
      // Move randomly
      setPosition({
        x: (Math.random() - 0.5) * 100, // Move up to 50px left/right
        y: (Math.random() - 0.5) * 50   // Move up to 25px up/down
      });
    } else {
      // Found it!
      setIsOpen(true);
      setClickCount(0);
      setPosition({ x: 0, y: 0 });

      // Signal "unlocked" but don't claim yet (user must claim on achievements page)
      if (walletAddress) {
        fetch("/api/achievements/unlock", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            wallet: walletAddress,
            achievementId: "easter-egg"
          })
        }).catch(err => console.error("Failed to unlock easter-egg achievement", err));
      }
    }
  };

  return (
    <footer className="border-t border-white/10 py-8 mt-12 bg-[#0A0A0B]">
      <div className="max-w-7xl mx-auto px-6 text-center">
        <p className="text-text-secondary text-base font-mono flex items-center justify-center gap-2 select-none">
          {t("made_with")}
          <span
            className="text-rust text-xl cursor-pointer transition-transform duration-200 inline-block relative"
            style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
            onClick={handleHeartClick}
          >
            ♥
          </span>
          {t("from")}
        </p>
        <div className="mt-4 flex justify-center gap-4 opacity-50">
          <span className="text-xs text-text-secondary/50">Solana Foundation</span>
        </div>
      </div>

      <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-xl z-[100]" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl aspect-[4/3] p-8 rounded-xl shadow-2xl z-[101] outline-none overflow-hidden border border-solana/30 flex flex-col justify-between">
            {/* Background and Overlay */}
            <div
              className="absolute inset-0 bg-cover bg-center z-0"
              style={{ backgroundImage: "url('/easteregg/rusty_kitagawa.png')" }}
            />
            {/* Very dark black overlay - artwork still visible but text pops */}
            <div className="absolute inset-0 bg-black/86 z-[1]" />
            <div className="absolute inset-0 backdrop-blur-[1px] z-[2]" />

            <div className="relative z-[10] flex flex-col h-full">
              <Dialog.Title className="text-solana font-mono font-bold text-xl mb-6 flex items-center gap-3">
                <span className="material-symbols-outlined text-2xl">terminal</span>
                ubuntu@superteam:~$
              </Dialog.Title>

              <div className="font-mono space-y-6 flex-1 flex flex-col justify-center">
                <p className="text-solana font-bold text-lg leading-tight tracking-tight">
                  {t("ubuntu_quote")}
                </p>

                <p className="text-white text-base leading-relaxed italic border-l-2 border-solana/50 pl-6 py-2 bg-solana/5 rounded-r-lg">
                  {t("motivation")}
                </p>

                <p className="text-text-secondary text-sm font-medium tracking-wide">
                  {t("mission")}
                </p>
              </div>

              <div className="mt-8 flex justify-end">
                <Dialog.Close asChild>
                  <button className="px-6 py-2 bg-solana/10 hover:bg-solana text-white hover:text-void border border-solana/30 rounded font-mono text-xs transition-all duration-300">
                    {t("exit")}
                  </button>
                </Dialog.Close>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </footer>
  );
}
