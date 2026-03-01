"use client";

import Link from "next/link";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useWallet } from "@solana/wallet-adapter-react";
import { BookOpen, Trophy, User, Settings, Globe, Award } from "lucide-react";
import { SolanaLogo } from "./SolanaLogo";
import { useI18n, languages } from "./I18nProvider";
import { useState, useEffect } from "react";

interface NavbarProps {
  showNavLinks?: boolean;
}

function NavLink({ href, icon: Icon, label }: { href: string; icon: any; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-white/60 hover:text-white hover:bg-white/5 transition-all"
    >
      <Icon className="w-4 h-4" />
      {label}
    </Link>
  );
}

function WalletButton() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="px-4 py-2 bg-white text-black rounded-md text-sm font-medium">
        Select Wallet
      </div>
    );
  }

  return <WalletMultiButton />;
}

export function Navbar({ showNavLinks = true }: NavbarProps) {
  const { connected } = useWallet();
  const { language, setLanguage, t } = useI18n();
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentLanguage = languages.find(l => l.code === language) || languages[0];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 bg-gradient-to-br from-purple-500 to-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <SolanaLogo className="w-6 h-6" />
            </div>
            <span className="font-serif italic text-base tracking-tight text-white hidden sm:block">Superteam Academy</span>
          </Link>

          {/* Navigation Links */}
          {showNavLinks && (
            <nav className="hidden md:flex items-center">
              <NavLink href="/courses" icon={BookOpen} label={t("nav.courses")} />
              <NavLink href="/leaderboard" icon={Trophy} label={t("nav.leaderboard")} />
              <NavLink href="/achievements" icon={Award} label={t("nav.achievements")} />
              {mounted && connected && (
                <>
                  <NavLink href="/dashboard" icon={Trophy} label={t("nav.dashboard")} />
                  <NavLink href="/profile" icon={User} label={t("nav.profile")} />
                  <NavLink href="/settings" icon={Settings} label={t("nav.settings")} />
                </>
              )}
            </nav>
          )}

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Language Switcher */}
            <div className="relative">
              <button
                onClick={() => setShowLangDropdown(!showLangDropdown)}
                className="flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-medium text-white/60 hover:text-white hover:bg-white/5 transition-all"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>{currentLanguage.label}</span>
              </button>

              {showLangDropdown && (
                <div className="absolute top-full right-0 mt-2 w-36 bg-zinc-900 border border-white/10 rounded-lg shadow-xl overflow-hidden z-50">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setLanguage(lang.code);
                        setShowLangDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs transition-colors ${
                        language === lang.code
                          ? "bg-white/10 text-white"
                          : "text-white/60 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      <span className="font-medium">{lang.label}</span>
                      <span className="ml-2 text-white/40">{lang.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Wallet Button */}
            <WalletButton />
          </div>
        </div>
      </div>
    </header>
  );
}
