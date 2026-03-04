'use client'

import React from 'react'
import Image from 'next/image'
import { Rocket, Shield } from 'lucide-react'
import { useI18n } from '@/lib/hooks/useI18n'
import logoLight from '@/Logo/HORIZONTAL/PNG/ST-DARK-GREEN-HORIZONTAL.png'
import logoDark from '@/Logo/HORIZONTAL/PNG/ST-OFF-WHITE-HORIZONTAL.png'

export function Footer() {
  const { t } = useI18n()
  const currentYear = new Date().getFullYear()

  return (
    <footer className="relative mt-24 overflow-hidden border-t border-gray-200 bg-gray-50 dark:border-superteam-navy/50 dark:bg-terminal-bg">
      <div className="pointer-events-none absolute -left-24 top-6 h-64 w-64 rounded-full bg-superteam-emerald/12 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 bottom-4 h-64 w-64 rounded-full bg-superteam-navy/20 blur-3xl" />

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-10 rounded-2xl border border-superteam-emerald/30 bg-white/80 p-6 backdrop-blur-sm dark:bg-[#0d1730]/75">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-superteam-yellow/35 bg-superteam-yellow/10 px-3 py-1 text-xs font-semibold tracking-wide text-superteam-forest dark:text-superteam-yellow">
                <Rocket size={13} />
                BUILD ON SOLANA
              </p>
              <p className="mt-2 max-w-2xl text-sm text-gray-600 dark:text-gray-300">
                {t('footer.tagline')}
              </p>
            </div>

            <span className="inline-flex items-center justify-center rounded-lg border border-superteam-emerald/45 bg-superteam-emerald/12 px-5 py-2.5 text-sm font-semibold text-superteam-forest dark:text-superteam-emerald">
              Solana Builder Hub
            </span>
          </div>
        </div>

        <div className="mb-10">
          <div className="inline-flex items-center gap-3">
            <Image
              src={logoLight}
              alt="Superteam Academy"
              className="h-9 w-auto dark:hidden"
            />
            <Image
              src={logoDark}
              alt="Superteam Academy"
              className="hidden h-9 w-auto dark:block"
            />
          </div>
          <p className="mt-4 max-w-lg text-sm text-gray-600 dark:text-gray-300">
            {t('footer.tagline')}
          </p>
          <div className="mt-5 flex flex-wrap gap-2 text-xs">
            <span className="inline-flex items-center gap-1 rounded-full border border-superteam-emerald/35 bg-superteam-emerald/10 px-3 py-1 font-semibold text-superteam-forest dark:text-superteam-emerald">
              <Shield size={12} />
              On-chain Verified
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-superteam-navy/35 bg-superteam-navy/10 px-3 py-1 font-semibold text-superteam-navy dark:text-superteam-offwhite">
              Community First
            </span>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-6 text-sm text-gray-500 dark:border-superteam-navy/45 dark:text-gray-400">
          <p>{t('footer.copyright').replace('2026', String(currentYear))}</p>
        </div>
      </div>
    </footer>
  )
}
