"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { useI18n } from "@/components/providers/I18nProvider";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { useState } from "react";

export function Navbar() {
  const { user, loading, signOut } = useAuth();
  const { t } = useI18n();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/courses?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-6 py-4 md:px-12 md:py-6 w-full max-w-[1800px] mx-auto bg-[#Fdfdfc]/80 dark:bg-neutral-950/80 backdrop-blur-md transition-all duration-300 border-b border-transparent">
      {/* Brand */}
      <Link
        href="/"
        className="text-xl font-semibold tracking-tight cursor-pointer hover:opacity-70 transition-opacity"
      >
        Caminho.
      </Link>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-8">
        <div className="relative w-full">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-neutral-400"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search courses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-2.5 bg-neutral-100 dark:bg-neutral-800/50 border border-transparent rounded-full text-sm text-neutral-900 dark:text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 dark:focus:ring-white/10 focus:bg-white dark:focus:bg-neutral-800 transition-all"
          />
          <kbd className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-[10px] text-neutral-400 font-mono hidden lg:flex">
            ⌘K
          </kbd>
        </div>
      </form>

      {/* Desktop Nav - Only for logged in users */}
      <div className="hidden md:flex gap-6 text-sm font-medium text-neutral-600 dark:text-neutral-400">
        {user && (
          <>
            <Link href="/dashboard" className="hover:text-black dark:hover:text-white transition-colors">
              {t("nav.dashboard")}
            </Link>
            <Link href="/profile" className="hover:text-black dark:hover:text-white transition-colors">
              {t("nav.profile")}
            </Link>
          </>
        )}
      </div>

      {/* Right side */}
      <div className="hidden md:flex items-center gap-3">
        <ThemeToggle compact />
        <LanguageSwitcher compact />

        {loading ? (
          <div className="w-24 h-10 bg-neutral-100 dark:bg-neutral-800 rounded-full animate-pulse" />
        ) : user ? (
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors text-sm font-medium"
            >
              <div className="w-6 h-6 rounded-full bg-neutral-900 dark:bg-white flex items-center justify-center text-[10px] font-bold text-white dark:text-neutral-900">
                {user.email?.charAt(0).toUpperCase() ?? "U"}
              </div>
              <span className="max-w-[100px] truncate text-neutral-700 dark:text-neutral-300">
                {user.user_metadata?.full_name ||
                  user.email?.split("@")[0] ||
                  "User"}
              </span>
            </Link>
            <button
              onClick={signOut}
              className="px-4 py-2 text-xs font-medium text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors"
            >
              {t("common.signOut")}
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              href="/auth/sign-in"
              className="px-4 py-2.5 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors"
            >
              {t("common.signIn")}
            </Link>
          </div>
        )}
      </div>

      {/* Mobile Menu Button */}
      <button
        className="md:hidden p-2"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        aria-label="Toggle menu"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-5 h-5"
        >
          {mobileMenuOpen ? (
            <>
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </>
          ) : (
            <>
              <line x1="4" y1="8" x2="20" y2="8" />
              <line x1="4" y1="16" x2="20" y2="16" />
            </>
          )}
        </svg>
      </button>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="absolute top-full left-0 right-0 bg-[#Fdfdfc]/95 dark:bg-neutral-950/95 backdrop-blur-lg border-b border-neutral-200 dark:border-neutral-800 md:hidden py-6 px-6 space-y-4">
          {/* Mobile Search */}
          <form onSubmit={handleSearch} className="mb-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-neutral-400"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-neutral-100 dark:bg-neutral-800 rounded-full text-sm text-neutral-900 dark:text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
              />
            </div>
          </form>
          
          {user ? (
            <>
              <Link href="/dashboard" className="block text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors py-2" onClick={() => setMobileMenuOpen(false)}>
                {t("nav.dashboard")}
              </Link>
              <Link href="/profile" className="block text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors py-2" onClick={() => setMobileMenuOpen(false)}>
                {t("nav.profile")}
              </Link>
              <button
                onClick={() => { signOut(); setMobileMenuOpen(false); }}
                className="block text-sm font-medium text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors py-2"
              >
                {t("common.signOut")}
              </button>
            </>
          ) : (
            <div className="flex flex-col gap-3 pt-2">
              <Link href="/auth/sign-in" className="text-center py-3 border border-neutral-200 dark:border-neutral-700 rounded-full text-sm font-semibold hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors" onClick={() => setMobileMenuOpen(false)}>
                {t("common.signIn")}
              </Link>
            </div>
          )}
          {/* Mobile language & theme */}
          <div className="flex items-center gap-2 pt-4 border-t border-neutral-200 dark:border-neutral-800">
            <ThemeToggle />
            <LanguageSwitcher />
          </div>
        </div>
      )}
    </nav>
  );
}
