"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useTranslations } from "next-intl";

export function Footer() {
  const t = useTranslations("footer");
  const [clickCount, setClickCount] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isOpen, setIsOpen] = useState(false);

  const handleHeartClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Hide and seek game
    if (clickCount < 5) {
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
    }
  };

  return (
    <footer className="border-t border-white/10 py-8 mt-12 bg-[#0A0A0B]">
      <div className="max-w-7xl mx-auto px-6 text-center">
        <p className="text-text-secondary text-sm font-mono flex items-center justify-center gap-2 select-none">
          {t("made_with")}
          <span
            className="text-rust cursor-pointer transition-transform duration-200 inline-block relative"
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
          <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg p-6 bg-[#0A0A0B] border border-solana/20 rounded-xl shadow-2xl z-[101] outline-none">
            <Dialog.Title className="text-solana font-mono font-bold text-lg mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined">terminal</span>
              ubuntu@superteam:~$
            </Dialog.Title>
            <div className="font-mono text-text-primary text-sm leading-relaxed space-y-4">
              <p className="typing-effect">{t("ubuntu_quote")}</p>
              <p className="text-text-secondary">{t("mission")}</p>
            </div>
            <div className="mt-6 flex justify-end">
              <Dialog.Close asChild>
                <button className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded text-xs font-mono transition-colors">
                  {t("exit")}
                </button>
              </Dialog.Close>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </footer>
  );
}
