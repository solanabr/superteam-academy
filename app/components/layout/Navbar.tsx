"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import { useWallet } from "@solana/wallet-adapter-react";
import { useXP } from "@/context/XPContext";
import { useAuth } from "@/context/AuthContext";
import { shortenAddress, formatXP } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { useLang } from "@/context/LanguageContext";
import { translations } from "@/lib/i18n";
import { Menu, X, Zap, ChevronDown, Settings, User, Shield } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

const WalletMultiButton = dynamic(
  () => import("@solana/wallet-adapter-react-ui").then((m) => m.WalletMultiButton),
  { ssr: false }
);

const navLinks = [
  { href: "/courses", label: "COURSES" },
  { href: "/practice", label: "PRACTICE" },
  { href: "/daily", label: "CHALLENGE" },
  { href: "/community", label: "COMMUNITY" },
  { href: "/leaderboard", label: "LEADERBOARD" },
  { href: "/dashboard", label: "DASHBOARD" },
];

const languages = [
  { code: "en", flag: "🇺🇸", label: "English" },
  { code: "pt", flag: "🇧🇷", label: "Português" },
  { code: "es", flag: "🇪🇸", label: "Español" },
];

function SignInModal({ onClose, signInWithGoogle, signInWithGitHub }: {
  onClose: () => void;
  signInWithGoogle: () => void;
  signInWithGitHub: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm mx-4 bg-[#0a0a0a] border border-[#1a1a1a]">
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#1a1a1a]">
          <div>
            <h2 className="font-display font-black text-xl uppercase tracking-tight">SIGN IN</h2>
            <p className="text-[10px] font-mono text-[#444] mt-1">Choose how you want to sign in</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center border border-[#1a1a1a] text-[#444] hover:text-[#f5f5f0] hover:border-[#333] transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="p-4 space-y-2">
          {/* Google */}
          <button
            onClick={() => { signInWithGoogle(); onClose(); }}
            className="w-full flex items-center gap-4 px-5 py-4 border border-[#1a1a1a] hover:border-[#9945ff] hover:bg-[#1a1a1a] transition-all group"
          >
            <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span className="text-xs font-mono text-[#f5f5f0] uppercase tracking-widest group-hover:text-[#9945ff] transition-colors">
              Sign in with Google
            </span>
          </button>

          {/* GitHub */}
          <button
            onClick={() => { signInWithGitHub(); onClose(); }}
            className="w-full flex items-center gap-4 px-5 py-4 border border-[#1a1a1a] hover:border-[#9945ff] hover:bg-[#1a1a1a] transition-all group"
          >
            <svg className="w-5 h-5 flex-shrink-0 text-[#f5f5f0]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
            </svg>
            <span className="text-xs font-mono text-[#f5f5f0] uppercase tracking-widest group-hover:text-[#9945ff] transition-colors">
              Sign in with GitHub
            </span>
          </button>

          {/* Wallet */}
          <div className="w-full flex items-center gap-4 px-5 py-4 border border-[#1a1a1a] hover:border-[#9945ff] hover:bg-[#1a1a1a] transition-all group cursor-pointer">
            <svg className="w-5 h-5 flex-shrink-0 text-[#9945ff]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            <WalletMultiButton
              style={{
                background: "transparent",
                borderRadius: "0px",
                fontSize: "12px",
                fontFamily: "Space Mono, monospace",
                fontWeight: "700",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                height: "auto",
                padding: "0",
                color: "#f5f5f0",
                boxShadow: "none",
              }}
            />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-[#1a1a1a]">
          <p className="text-[9px] font-mono text-[#333] text-center uppercase tracking-widest">
            By signing in you agree to our terms of service
          </p>
        </div>
      </div>
    </div>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const { publicKey } = useWallet();
  const { xp, level } = useXP();
  const { user, signInWithGoogle, signInWithGitHub, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [signInOpen, setSignInOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { lang, setLang } = useLang();
  const navT = translations[lang].nav;
  const langRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const currentLang = languages.find(l => l.code === lang) || languages[0];
  const { theme, toggleTheme } = useTheme();
  const profileHref = user
    ? `/profile/${user.email}`
    : publicKey
    ? `/profile/${publicKey.toBase58()}`
    : "/";

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      {signInOpen && (
        <SignInModal
          onClose={() => setSignInOpen(false)}
          signInWithGoogle={signInWithGoogle}
          signInWithGitHub={signInWithGitHub}
        />
      )}

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

            {/* Desktop nav links */}
            <div className="hidden md:flex items-center gap-0">
              {[
                { href: "/courses", label: navT.courses },
{ href: "/practice", label: "PRACTICE" },
{ href: "/daily", label: "CHALLENGE" },
{ href: "/community", label: "COMMUNITY" },
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

            {/* Right side */}
            <div className="hidden md:flex items-center gap-3">

              {/* XP display */}
              {(publicKey || user) && (
                <div className="flex items-center gap-3 text-[10px] font-mono">
                  <span className="text-[#9945ff]">{formatXP(xp)}_XP</span>
                  <span className="text-[#333]">|</span>
                  <span className="text-[#14f195]">LVL_{level}</span>
                </div>
              )}
<button
  onClick={toggleTheme}
  className="flex items-center justify-center w-9 h-9 border border-[#1a1a1a] text-[#444] hover:border-[#9945ff] hover:text-[#9945ff] transition-colors"
  title="Toggle theme"
>
  {theme === "dark" ? "☀️" : "🌙"}
</button>
              {/* Language switcher */}
              <div className="relative" ref={langRef}>
                <button
                  onClick={() => setLangOpen(!langOpen)}
                  className="flex items-center gap-1.5 px-3 py-2 border border-[#1a1a1a] text-[10px] font-mono hover:border-[#9945ff] transition-colors"
                >
                  <span>{currentLang.flag}</span>
                  <ChevronDown className="w-3 h-3 text-[#444]" />
                </button>
                {langOpen && (
                  <div className="absolute right-0 top-full mt-1 w-44 bg-[#0a0a0a] border border-[#1a1a1a] z-50">
                    {languages.map((l) => (
                      <button
                        key={l.code}
                        onClick={() => { setLang(l.code as "en" | "pt" | "es"); setLangOpen(false); }}
                        className={cn(
                          "w-full flex items-center gap-3 px-4 py-3 text-[10px] font-mono uppercase tracking-widest transition-colors border-b border-[#1a1a1a] last:border-b-0",
                          lang === l.code
                            ? "text-[#9945ff] bg-[#1a1a1a]"
                            : "text-[#444] hover:text-[#f5f5f0] hover:bg-[#1a1a1a]"
                        )}
                      >
                        <span>{l.flag}</span>
                        <span>{l.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* User menu or Sign In */}
              {user || publicKey ? (
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 px-3 py-2 border border-[#14f195]/20 text-[#14f195] font-mono text-[9px] uppercase tracking-widest hover:border-[#14f195] transition-colors"
                  >
                    <User className="w-3 h-3" />
                    <span>
                      {user
                        ? user.email?.split('@')[0].toUpperCase().slice(0, 10)
                        : shortenAddress(publicKey!.toBase58())}
                    </span>
                    <ChevronDown className="w-3 h-3" />
                  </button>

                  {userMenuOpen && (
  <div className="absolute right-0 top-full mt-1 w-48 bg-[#0a0a0a] border border-[#1a1a1a] z-50">
    <Link
      href={profileHref}
      onClick={() => setUserMenuOpen(false)}
      className="flex items-center gap-3 px-4 py-3 text-[10px] font-mono text-[#444] hover:text-[#f5f5f0] hover:bg-[#1a1a1a] transition-colors border-b border-[#1a1a1a] uppercase tracking-widest"
    >
      <User className="w-3 h-3" />
      View Profile
    </Link>
    <Link
  href="/settings"
  onClick={() => setUserMenuOpen(false)}
  className="flex items-center gap-3 px-4 py-3 text-[10px] font-mono text-[#444] hover:text-[#f5f5f0] hover:bg-[#1a1a1a] transition-colors border-b border-[#1a1a1a] uppercase tracking-widest"
>
  <Settings className="w-3 h-3" />
  Settings
</Link>
<Link
  href="/admin"
  onClick={() => setUserMenuOpen(false)}
  className="flex items-center gap-3 px-4 py-3 text-[10px] font-mono text-[#9945ff] hover:bg-[#9945ff]/10 transition-colors border-b border-[#1a1a1a] uppercase tracking-widest"
>
  <Shield className="w-3 h-3" />
  Admin Panel
</Link>
    {!publicKey && (
      <div className="border-b border-[#1a1a1a]">
        <div className="px-4 py-2 text-[9px] font-mono text-[#333] uppercase tracking-widest">
          Connect Wallet
        </div>
        <div className="px-3 pb-2">
          <WalletMultiButton
            style={{
              background: "#9945ff",
              borderRadius: "0px",
              fontSize: "9px",
              fontFamily: "Space Mono, monospace",
              fontWeight: "700",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              height: "32px",
              padding: "0 12px",
              width: "100%",
            }}
          />
        </div>
      </div>
    )}
    {publicKey && (
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[#1a1a1a]">
        <div className="w-2 h-2 rounded-full bg-[#14f195]" />
        <span className="text-[9px] font-mono text-[#14f195] uppercase tracking-widest">
          {shortenAddress(publicKey.toBase58())}
        </span>
      </div>
    )}
    <button
      onClick={() => { signOut(); setUserMenuOpen(false); }}
      className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-mono text-[#ff3366] hover:bg-[#ff3366]/10 transition-colors uppercase tracking-widest"
    >
      <X className="w-3 h-3" />
      Sign Out
    </button>
  </div>
)}
                </div>
              ) : (
                <>
                  <button
                    onClick={() => setSignInOpen(true)}
                    className="px-4 py-2 border border-[#1a1a1a] text-[#f5f5f0] font-mono text-[9px] uppercase tracking-widest hover:border-[#9945ff] hover:text-[#9945ff] transition-colors"
                  >
                    SIGN_IN
                  </button>
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
                </>
              )}
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
            {(user || publicKey) && (
              <>
                <Link
                  href={profileHref}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 px-6 py-4 text-[10px] font-mono text-[#14f195] border-b border-[#1a1a1a] uppercase tracking-widest"
                >
                  <User className="w-3 h-3" /> Profile
                </Link>
                <Link
                  href="/settings"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 px-6 py-4 text-[10px] font-mono text-[#444] border-b border-[#1a1a1a] uppercase tracking-widest hover:text-[#f5f5f0]"
                >
                  <Settings className="w-3 h-3" /> Settings
                </Link>
              </>
            )}
            <div className="px-6 py-4 border-b border-[#1a1a1a] flex gap-3">
              {languages.map((l) => (
                <button
                  key={l.code}
                  onClick={() => setLang(l.code as "en" | "pt" | "es")}
                  className={cn(
                    "flex items-center gap-1 px-3 py-1 text-[9px] font-mono uppercase border transition-colors",
                    lang === l.code ? "border-[#9945ff] text-[#9945ff]" : "border-[#1a1a1a] text-[#444]"
                  )}
                >
                  {l.flag} {l.code.toUpperCase()}
                </button>
              ))}
            </div>
            {!user && !publicKey && (
              <button
                onClick={() => { setSignInOpen(true); setMobileOpen(false); }}
                className="w-full flex items-center justify-center px-6 py-4 text-[10px] font-mono uppercase tracking-widest border-b border-[#1a1a1a] text-[#f5f5f0] hover:text-[#9945ff] transition-colors"
              >
                SIGN_IN
              </button>
            )}
            {(user || publicKey) && (
              <button
                onClick={signOut}
                className="w-full flex items-center justify-center px-6 py-4 text-[10px] font-mono uppercase tracking-widest border-b border-[#1a1a1a] text-[#ff3366]"
              >
                SIGN_OUT
              </button>
            )}
            {!user && (
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
            )}
          </div>
        )}
      </nav>
    </>
  );
}