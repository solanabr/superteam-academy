"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { useUserStore } from "@/store/user-store";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Terminal, Mail, CheckCircle2, ArrowRight } from "lucide-react";

export function Footer() {
  const t = useTranslations("footer");
  const user = useUserStore((s) => s.user);
  const [clickCount, setClickCount] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isOpen, setIsOpen] = useState(false);

  // Newsletter state
  const [email, setEmail] = useState("");
  const [subscribeStatus, setSubscribeStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [subscribeMessage, setSubscribeMessage] = useState("");

  const linkedAddress =
    user?.profile?.walletAddress ?? user?.walletAddress;
  const walletAddress =
    linkedAddress ??
    (typeof window !== "undefined" &&
      localStorage.getItem("linkedWalletAddress"));

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

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setSubscribeStatus("loading");
    setSubscribeMessage("");

    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t("newsletter_error"));

      setSubscribeStatus("success");
      setSubscribeMessage(t("newsletter_success"));
      setEmail("");

      // Reset success message after 3 seconds
      setTimeout(() => {
        setSubscribeStatus("idle");
        setSubscribeMessage("");
      }, 3000);
    } catch (err: any) {
      setSubscribeStatus("error");
      setSubscribeMessage(err.message || t("newsletter_error"));
    }
  };

  return (
    <footer className="w-full border-t border-white/10 py-6 mt-auto glass-panel-flat backdrop-blur-md bg-[#0A0A0B]/80 relative z-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-6">
          {/* Left Column: Newsletter */}
          <div className="flex flex-col gap-4 max-w-[280px]">
            <div className="flex items-center gap-2 opacity-60">
              <Mail className="h-4 w-4 text-solana" />
              <h3 className="text-white text-[10px] font-bold tracking-widest uppercase">
                {t("newsletter_title")}
              </h3>
            </div>
            <form onSubmit={handleSubscribe} className="flex flex-row gap-2 relative w-full">
              <Input
                type="email"
                placeholder={t("newsletter_placeholder")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-white/[0.03] border-white/10 text-white placeholder:text-white/20 h-10 text-[10px] flex-1 rounded-full px-5 focus:border-solana/50 transition-all font-mono"
                disabled={subscribeStatus === "loading" || subscribeStatus === "success"}
                required
              />
              <Button
                type="submit"
                size="sm"
                aria-label={t("newsletter_subscribe")}
                disabled={subscribeStatus === "loading" || subscribeStatus === "success"}
                className={`h-10 px-4 rounded-full shrink-0 transition-all duration-300 font-bold ${subscribeStatus === "success" ? "bg-emerald-500 hover:bg-emerald-600 text-white" : "bg-white/10 hover:bg-solana hover:text-void text-white border-none"}`}
              >
                {subscribeStatus === "loading" ? (
                  "..."
                ) : subscribeStatus === "success" ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <ArrowRight className="h-4 w-4" />
                )}
              </Button>
            </form>
          </div>

          {/* Center Column: Easter Egg (Single Line) */}
          <div className="flex items-center justify-center gap-4 whitespace-nowrap overflow-visible">
            <p className="text-text-secondary text-sm font-mono flex items-center gap-3 select-none">
              {t("made_with")}
              <span
                role="button"
                aria-label="Find the hidden secret"
                className="text-[#FFD23F] text-2xl cursor-pointer transition-all duration-300 inline-block relative hover:scale-125 hover:rotate-12 active:scale-95 drop-shadow-[0_0_8px_rgba(255,210,63,0.4)]"
                style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
                onClick={handleHeartClick}
              >
                ♥
              </span>
              {t("from")}
            </p>
            <img
              src="/logo/st-brazil-horizontal.svg"
              alt="Superteam Brazil"
              className="h-7 w-auto filter drop-shadow-[0_0_10px_rgba(20,241,149,0.2)]"
            />
          </div>

          {/* Right Column: Empty for balance */}
          <div className="hidden md:block" />
        </div>

        {/* Bottom Bar: Copyright, Socials, Legal */}
        <div className="mt-8 pt-4 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4 text-[10px] uppercase tracking-[0.2em] font-mono font-bold text-text-muted">
          {/* Copyright */}
          <div className="flex-1 text-left">
            <p>© {new Date().getFullYear()} SUPERTEAM ACADEMY</p>
          </div>

          {/* Social Icons at Center */}
          <div className="flex items-center justify-center gap-6 flex-1">
            <a href="https://twitter.com/SuperteamBR" target="_blank" rel="noopener noreferrer" className="text-text-muted hover:text-solana transition-colors" title="X (Twitter)">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.004 3.916H5.078z"></path></svg>
            </a>
            <a href="https://linktr.ee/superteamBR" target="_blank" rel="noopener noreferrer" className="text-text-muted hover:text-solana transition-colors" title="Linktree">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M13.6191 16.5188L21.465 8.67283H15.003L15.003 0.160156L8.99596 0.160156V8.67283H2.53396L10.3799 16.5188L11.9995 18.1384L13.6191 16.5188Z" fill="currentColor" />
                <path d="M8.99596 23.8398H15.003V16.8926H8.99596V23.8398Z" fill="currentColor" />
              </svg>
            </a>
          </div>

          {/* Legal Links */}
          <div className="flex items-center justify-end gap-8 flex-1">
            <Link href="/privacy" className="hover:text-solana transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-solana transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>

      <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-xl z-[100]" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl aspect-[4/3] p-8 rounded-xl shadow-2xl z-[101] outline-none overflow-hidden border border-solana/30 flex flex-col justify-between">
            {/* Background and Overlay */}
            <div
              className="absolute inset-0 bg-cover bg-center z-0"
              style={{ backgroundImage: "url('/easteregg/AINote.jpg')" }}
            />
            {/* Very dark black overlay - artwork still visible but text pops */}
            <div className="absolute inset-0 bg-black/86 z-[1]" />
            <div className="absolute inset-0 backdrop-blur-[1px] z-[2]" />

            <div className="relative z-[10] flex flex-col h-full">
              <Dialog.Title className="text-solana font-mono font-bold text-xl mb-6 flex items-center gap-3">
                <Terminal size={24} />
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
                  <Button variant="outline" size="sm" className="bg-solana/10 hover:bg-solana text-white hover:text-void border-solana/30 font-mono text-xs">
                    {t("exit")}
                  </Button>
                </Dialog.Close>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </footer>
  );
}
