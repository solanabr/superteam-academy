"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletReadyState } from "@solana/wallet-adapter-base";
import { useLang } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Loader } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const WALLET_URLS: Record<string, string> = {
  phantom: "https://phantom.app/",
  solflare: "https://solflare.com/",
};

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
}

export function AuthModal({ open, onClose }: AuthModalProps) {
  const { t } = useLang();
  const { loginWithSocial, isAuthenticated } = useAuth();
  const { select, wallets, connecting, connect } = useWallet();
  const [socialLoading, setSocialLoading] = useState<string | null>(null);

  // Close modal if user just authenticated
  if (isAuthenticated && open) {
    onClose();
  }

  const handleWalletConnect = async (walletName: string) => {
    // Find the wallet adapter by name
    const walletAdapter = wallets.find(
      (w) => w.adapter.name.toLowerCase().includes(walletName.toLowerCase())
    );

    if (!walletAdapter) {
      // Wallet not found at all — open download page
      window.open(WALLET_URLS[walletName] || "https://phantom.app/", "_blank");
      return;
    }

    // Check if wallet extension is installed
    const ready = walletAdapter.readyState;
    if (
      ready === WalletReadyState.NotDetected ||
      ready === WalletReadyState.Unsupported
    ) {
      // Extension not installed — open download page
      window.open(WALLET_URLS[walletName] || walletAdapter.adapter.url, "_blank");
      return;
    }

    // Wallet is installed — select and connect
    try {
      select(walletAdapter.adapter.name);
      // Small delay to let select() propagate, then connect
      setTimeout(async () => {
        try {
          await connect();
        } catch {
          // User may have rejected the connection — that's OK
        }
      }, 100);
    } catch {
      // Error selecting wallet
    }
  };

  const handleSocialLogin = async (provider: "google" | "github") => {
    setSocialLoading(provider);
    try {
      await loginWithSocial(provider);
    } catch {
      // Error handled silently - user can retry
    } finally {
      setSocialLoading(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-gray-900 border-slate-200 dark:border-gray-700">
        <DialogHeader className="text-center">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-green-400 to-yellow-400 flex items-center justify-center text-gray-950 font-bold text-xl mb-4">
            ST
          </div>
          <DialogTitle className="text-2xl font-bold text-slate-900 dark:text-white text-center">
            {t("auth.title")}
          </DialogTitle>
        </DialogHeader>

        {/* Wallet Options */}
        <div className="space-y-3 mb-6">
          {/* Phantom */}
          <button
            onClick={() => handleWalletConnect("phantom")}
            disabled={connecting}
            className="w-full flex items-center gap-4 px-5 py-3.5 rounded-xl bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 hover:border-green-400 dark:hover:border-green-500/50 hover:bg-green-50 dark:hover:bg-gray-800/80 transition-all group disabled:opacity-50 disabled:cursor-wait"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center overflow-hidden">
              <svg width="24" height="24" viewBox="0 0 128 128" fill="none">
                <rect width="128" height="128" rx="26" fill="#AB9FF2"/>
                <path d="M110.584 64.9142H99.142C99.142 41.7651 80.173 23 56.7724 23C33.6612 23 14.8716 41.3042 14.4169 64.0958C13.9504 87.4644 36.0644 108 59.4656 108H63.4586C83.7948 108 110.584 89.1628 110.584 64.9142Z" fill="url(#paint0_linear)"/>
                <circle cx="46.5" cy="58.5" r="7.5" fill="white"/>
                <circle cx="71.5" cy="58.5" r="7.5" fill="white"/>
                <defs>
                  <linearGradient id="paint0_linear" x1="63" y1="23" x2="63" y2="108" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#534BB1"/>
                    <stop offset="1" stopColor="#551BF9"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <div className="text-left flex-1">
              <div className="text-slate-900 dark:text-white font-semibold">
                {t("auth.phantom")}
              </div>
              <div className="text-slate-400 dark:text-gray-500 text-xs">
                {t("auth.solanaWallet")}
              </div>
            </div>
            {connecting ? (
              <Loader size={16} className="animate-spin text-green-500" />
            ) : (
              <div className="text-slate-300 dark:text-gray-600 group-hover:text-green-500 dark:group-hover:text-green-400 transition-colors text-sm">
                &rarr;
              </div>
            )}
          </button>

          {/* Solflare */}
          <button
            onClick={() => handleWalletConnect("solflare")}
            disabled={connecting}
            className="w-full flex items-center gap-4 px-5 py-3.5 rounded-xl bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 hover:border-orange-400 dark:hover:border-orange-500/50 hover:bg-orange-50 dark:hover:bg-gray-800/80 transition-all group disabled:opacity-50 disabled:cursor-wait"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-yellow-500 flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="text-left flex-1">
              <div className="text-slate-900 dark:text-white font-semibold">
                {t("auth.solflare")}
              </div>
              <div className="text-slate-400 dark:text-gray-500 text-xs">
                {t("auth.solanaWallet")}
              </div>
            </div>
            {connecting ? (
              <Loader size={16} className="animate-spin text-orange-500" />
            ) : (
              <div className="text-slate-300 dark:text-gray-600 group-hover:text-orange-500 dark:group-hover:text-orange-400 transition-colors text-sm">
                &rarr;
              </div>
            )}
          </button>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 h-px bg-slate-200 dark:bg-gray-700" />
          <span className="text-slate-400 dark:text-gray-500 text-sm">
            {t("auth.or")}
          </span>
          <div className="flex-1 h-px bg-slate-200 dark:bg-gray-700" />
        </div>

        {/* Social Options */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handleSocialLogin("google")}
            disabled={socialLoading === "google"}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 hover:border-red-300 dark:hover:border-red-500/50 text-slate-700 dark:text-white font-medium text-sm transition-all hover:bg-red-50 dark:hover:bg-gray-800/80 disabled:opacity-50 disabled:cursor-wait"
          >
            {socialLoading === "google" ? (
              <Loader size={16} className="animate-spin" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
            )}
            Google
          </button>
          <button
            onClick={() => handleSocialLogin("github")}
            disabled={socialLoading === "github"}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 hover:border-slate-400 dark:hover:border-gray-500/50 text-slate-700 dark:text-white font-medium text-sm transition-all hover:bg-slate-100 dark:hover:bg-gray-800/80 disabled:opacity-50 disabled:cursor-wait"
          >
            {socialLoading === "github" ? (
              <Loader size={16} className="animate-spin" />
            ) : (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path
                  fillRule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                  clipRule="evenodd"
                />
              </svg>
            )}
            GitHub
          </button>
        </div>

        {/* Info text */}
        <p className="text-center text-slate-400 dark:text-gray-600 text-xs mt-4">
          {t("auth.connectDescription")}
        </p>
      </DialogContent>
    </Dialog>
  );
}
