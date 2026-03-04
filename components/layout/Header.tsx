'use client'

import Link from 'next/link'
import React, { useState } from 'react'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { useI18n } from '@/lib/hooks/useI18n'
import type { Language } from '@/lib/i18n/translations'
import { ThemeSwitcher } from '@/components/ui'
import { AuthButtons } from '@/components/auth/AuthButtons'
import logoLight from '@/Logo/HORIZONTAL/PNG/ST-DARK-GREEN-HORIZONTAL.png'
import logoDark from '@/Logo/HORIZONTAL/PNG/ST-OFF-WHITE-HORIZONTAL.png'

export function Header() {
  const { t, language, setLanguage } = useI18n()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-terminal-bg/95 backdrop-blur border-b border-gray-200 dark:border-terminal-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="group flex items-center gap-2">
            <Image
              src={logoLight}
              alt="Superteam Academy"
              className="h-7 w-auto transition-opacity duration-200 group-hover:opacity-80 dark:hidden"
              priority
            />
            <Image
              src={logoDark}
              alt="Superteam Academy"
              className="hidden h-7 w-auto transition-opacity duration-200 group-hover:opacity-80 dark:block"
              priority
            />
            <span className="hidden rounded-full border border-superteam-emerald/30 bg-superteam-offwhite/70 px-2 py-1 text-[10px] font-semibold tracking-wide text-superteam-forest dark:border-superteam-yellow/50 dark:bg-superteam-navy/40 dark:text-superteam-yellow sm:inline-flex">
              ACADEMY
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            <NavLink href="/courses" pathname={pathname}>{t('nav.courses')}</NavLink>
            <NavLink href="/dashboard" pathname={pathname}>{t('nav.dashboard')}</NavLink>
            <NavLink href="/leaderboard" pathname={pathname}>{t('nav.leaderboard')}</NavLink>
            <NavLink href="/certificates" pathname={pathname}>{t('profile.credentials')}</NavLink>
            <NavLink href="/profile" pathname={pathname}>{t('nav.profile')}</NavLink>
          </nav>

          {/* Right Section */}
          <div className="flex items-center gap-4">
            {/* Language Selector */}
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              className="rounded-md border border-superteam-emerald/35 bg-superteam-offwhite/80 px-2 py-1 text-sm text-superteam-forest shadow-sm transition-all duration-200 hover:bg-superteam-yellow/30 hover:border-superteam-emerald/60 dark:border-superteam-yellow/35 dark:bg-superteam-navy/35 dark:text-superteam-yellow dark:hover:bg-superteam-navy/55"
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
            <WalletMultiButton className="!rounded-md !border !border-superteam-emerald/35 !bg-superteam-offwhite/80 !px-3 !py-1 !text-sm !font-semibold !text-superteam-forest !shadow-sm !transition-all !duration-200 hover:!-translate-y-0.5 hover:!bg-superteam-yellow/30 hover:!border-superteam-emerald/60 hover:!shadow-[0_8px_16px_-12px_rgba(35,58,117,0.85)] dark:!border-superteam-yellow/35 dark:!bg-superteam-navy/35 dark:!text-superteam-yellow dark:hover:!bg-superteam-navy/55" />

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-md border border-superteam-emerald/35 bg-superteam-offwhite/80 px-2 py-1 text-superteam-forest transition-all duration-200 hover:bg-superteam-yellow/30 dark:border-superteam-yellow/35 dark:bg-superteam-navy/35 dark:text-superteam-yellow dark:hover:bg-superteam-navy/55 md:hidden"
            >
              ☰
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileMenuOpen && (
          <nav className="space-y-2 border-t border-gray-200 pb-4 pt-2 dark:border-terminal-border md:hidden">
            <NavLink href="/courses" pathname={pathname}>{t('nav.courses')}</NavLink>
            <NavLink href="/dashboard" pathname={pathname}>{t('nav.dashboard')}</NavLink>
            <NavLink href="/leaderboard" pathname={pathname}>{t('nav.leaderboard')}</NavLink>
            <NavLink href="/certificates" pathname={pathname}>{t('profile.credentials')}</NavLink>
            <NavLink href="/profile" pathname={pathname}>{t('nav.profile')}</NavLink>
          </nav>
        )}
      </div>
    </header>
  )
}

function NavLink({ href, pathname, children }: { href: string; pathname: string; children: React.ReactNode }) {
  const isActive = pathname === href || pathname.startsWith(`${href}/`)

  return (
    <Link
      href={href}
      className={`group relative block rounded-md px-4 py-2 text-sm font-medium transition-all duration-200 ${
        isActive
          ? 'bg-superteam-emerald/12 text-superteam-forest dark:bg-superteam-navy/45 dark:text-superteam-yellow'
          : 'text-gray-700 hover:bg-superteam-emerald/8 hover:text-superteam-forest dark:text-gray-300 dark:hover:bg-superteam-navy/35 dark:hover:text-superteam-emerald'
      }`}
    >
      {children}
      <span
        className={`pointer-events-none absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full bg-gradient-to-r from-superteam-emerald via-superteam-yellow to-superteam-navy transition-opacity duration-200 ${
          isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-80'
        }`}
      />
    </Link>
  )
}
