"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import { useWallet } from "@solana/wallet-adapter-react";
import { useXP } from "@/context/XPContext";
import { shortenAddress, formatXP } from "@/lib/utils";
import { getLevelFromXP } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Menu, X, Zap } from "lucide-react";
import { useLang } from "@/context/LanguageContext";
import { translations } from "@/lib/i18n";

const WalletMultiButton = dynamic(
  () => import("@solana/wallet-adapter-react-ui").then((m) => m.WalletMultiButton),
  { ssr: false }
);

const navLinks = [
  { href: "/courses", label: "COURSES" },
  { href: "/leaderboard", label: "LEADERBOARD" },
  { href: "/dashboard", label: "DASHBOARD" },
];

export function Navbar() {
  const pathname = usePathname();
  const { publicKey } = useWallet();
  const { xp, level } = useXP();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { lang, setLang } = useLang();
  const navT = translations[lang].nav;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#020202] border-b border-[#1a1a1a]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-14">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-6 h-6 bg-[#9945ff] flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-display font-black text-sm uppercase tracking-widest text-[#f5f5f0] group-hover:text-[#9945ff] transition-colors">
              SUPERTEAM ACADEMY
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-0">
            {[
              { href: "/courses", label: navT.courses },
              { href: "/leaderboard", label: navT.leaderboard },
              { href: "/dashboard", label: navT.dashboard },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "px-5 py-4 text-[10px] font-mono uppercase tracking-widest transition-colors border-r border-[#1a1a1a] first:border-l",
                  pathname === link.href
                    ? "text-[#9945ff] bg-[#0a0a0a]"
                    : "text-[#444] hover:text-[#f5f5f0] hover:bg-[#0a0a0a]"
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right */}
          <div className="hidden md:flex items-center gap-4">
            {publicKey && (
              <div className="flex items-center gap-3 text-[10px] font-mono">
                <span className="text-[#9945ff]">{formatXP(xp)}_XP</span>
                <span className="text-[#333]">|</span>
                <span className="text-[#14f195]">LVL_{level}</span>
                <span className="text-[#333]">|</span>
                <Link
                  href={`/profile/${publicKey.toBase58()}`}
                  className="text-[#444] hover:text-[#f5f5f0] transition-colors"
                >
                  {shortenAddress(publicKey.toBase58())}
                </Link>
              </div>
            )}
            <div className="flex border border-[#1a1a1a]">
              {(["en", "pt", "es"] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={cn(
                    "px-3 py-2 text-[9px] font-mono uppercase tracking-widest transition-colors border-r border-[#1a1a1a] last:border-r-0 flex items-center gap-1",
                    lang === l
                      ? "bg-[#9945ff] text-white"
                      : "bg-[#020202] text-[#444] hover:text-[#f5f5f0] hover:bg-[#0a0a0a]"
                  )}
                >
                  {l === "en" ? "🇺🇸" : l === "pt" ? "🇧🇷" : "🇪🇸"}
                  <span>{l.toUpperCase()}</span>
                </button>
              ))}
            </div>
            <WalletMultiButton
              style={{
                background: "#9945ff",
                borderRadius: "0px",
                fontSize: "10px",
                fontFamily: "Space Mono, monospace",
                fontWeight: "700",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                height: "36px",
                padding: "0 16px",
              }}
            />
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 text-[#444] hover:text-[#f5f5f0] transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-[#1a1a1a] bg-[#020202]">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center px-6 py-4 text-[10px] font-mono uppercase tracking-widest border-b border-[#1a1a1a] transition-colors",
                pathname === link.href
                  ? "text-[#9945ff] bg-[#0a0a0a]"
                  : "text-[#444] hover:text-[#f5f5f0]"
              )}
            >
              {link.label}
            </Link>
          ))}
          <div className="p-4">
            <WalletMultiButton
              style={{
                background: "#9945ff",
                borderRadius: "0px",
                fontSize: "10px",
                fontFamily: "Space Mono, monospace",
                fontWeight: "700",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                width: "100%",
                height: "40px",
              }}
            />
          </div>
        </div>
      )}
    </nav>
  );
}