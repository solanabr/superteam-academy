'use client'

import Link from 'next/link'
import React, { useState } from 'react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { useI18n } from '@/lib/hooks/useI18n'
import type { Language } from '@/lib/i18n/translations'
import { ThemeSwitcher } from '@/components/ui'
import { AuthButtons } from '@/components/auth/AuthButtons'

export function Header() {
  const { t, language, setLanguage } = useI18n()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-terminal-bg/95 backdrop-blur border-b border-gray-200 dark:border-terminal-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl font-bold text-neon-cyan font-display">⚡</span>
            <span className="text-xl font-bold text-neon-cyan font-display hidden sm:inline">
              Superteam
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            <NavLink href="/courses">{t('nav.courses')}</NavLink>
            <NavLink href="/dashboard">{t('nav.dashboard')}</NavLink>
            <NavLink href="/leaderboard">{t('nav.leaderboard')}</NavLink>
            <NavLink href="/certificates">{t('profile.credentials')}</NavLink>
            <NavLink href="/profile">{t('nav.profile')}</NavLink>
          </nav>

          {/* Right Section */}
          <div className="flex items-center gap-4">
            {/* Language Selector */}
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              className="bg-gray-100 dark:bg-terminal-surface border border-gray-300 dark:border-terminal-border rounded px-2 py-1 text-sm text-blue-600 dark:text-neon-cyan hover:border-blue-600 dark:hover:border-neon-cyan transition-colors"
            >
              <option value="en">EN</option>
              <option value="pt-br">PT-BR</option>
              <option value="es">ES</option>
            </select>

            {/* Theme Switcher */}
            <ThemeSwitcher />

            {/* OAuth Sign-In */}
            <AuthButtons />

            {/* Wallet Multi-Button */}
            <WalletMultiButton className="!bg-gray-100 dark:!bg-terminal-surface !text-blue-600 dark:!text-neon-cyan !rounded !px-3 !py-1 !text-sm !font-semibold !shadow-none hover:!bg-blue-100 dark:hover:!bg-terminal-surface/80 transition-colors" />

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-neon-cyan hover:text-neon-cyan/70"
            >
              ☰
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileMenuOpen && (
          <nav className="md:hidden pb-4 space-y-2 border-t border-gray-200 dark:border-terminal-border">
            <NavLink href="/courses">{t('nav.courses')}</NavLink>
            <NavLink href="/dashboard">{t('nav.dashboard')}</NavLink>
            <NavLink href="/leaderboard">{t('nav.leaderboard')}</NavLink>
            <NavLink href="/certificates">{t('profile.credentials')}</NavLink>
            <NavLink href="/profile">{t('nav.profile')}</NavLink>
          </nav>
        )}
      </div>
    </header>
  )
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-neon-cyan transition-colors rounded"
    >
      {children}
    </Link>
  )
}
