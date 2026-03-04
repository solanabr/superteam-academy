'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Github, MessageCircle, Rocket, Shield, Twitter } from 'lucide-react'
import { useI18n } from '@/lib/hooks/useI18n'
import logoLight from '@/Logo/HORIZONTAL/PNG/ST-DARK-GREEN-HORIZONTAL.png'
import logoDark from '@/Logo/HORIZONTAL/PNG/ST-OFF-WHITE-HORIZONTAL.png'

export function Footer() {
  const { t } = useI18n()
  const currentYear = new Date().getFullYear()
  const [newsletterEmail, setNewsletterEmail] = React.useState('')
  const [newsletterSaved, setNewsletterSaved] = React.useState(false)

  const handleNewsletterSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!newsletterEmail.trim()) return
    setNewsletterSaved(true)
    setNewsletterEmail('')
    window.setTimeout(() => setNewsletterSaved(false), 2500)
  }

  return (
    <footer className="relative mt-24 overflow-hidden border-t border-gray-200 bg-gray-50 dark:border-superteam-navy/50 dark:bg-terminal-bg">
      <div className="pointer-events-none absolute -left-24 top-6 h-64 w-64 rounded-full bg-superteam-emerald/12 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 bottom-4 h-64 w-64 rounded-full bg-superteam-navy/20 blur-3xl" />

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-10 rounded-2xl border border-superteam-emerald/30 bg-white/80 p-6 backdrop-blur-sm dark:bg-[#0d1730]/75 md:p-8">
          <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr] lg:items-center">
            <div>
              <p className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-superteam-yellow/35 bg-superteam-yellow/10 px-3 py-1 text-xs font-semibold tracking-wide text-superteam-forest dark:text-superteam-yellow">
                <Rocket size={13} />
                {t('footer.newsletterTag')}
              </p>
              <p className="mt-2 max-w-2xl text-sm text-gray-600 dark:text-gray-300">
                {t('footer.tagline')}
              </p>
            </div>

            <form onSubmit={handleNewsletterSubmit} className="space-y-3">
              <label className="block text-xs font-semibold uppercase tracking-wide text-superteam-forest dark:text-superteam-yellow">
                {t('footer.newsletterTitle')}
              </label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  type="email"
                  value={newsletterEmail}
                  onChange={(event) => setNewsletterEmail(event.target.value)}
                  placeholder={t('footer.newsletterPlaceholder')}
                  className="w-full rounded-lg border border-superteam-emerald/35 bg-white/95 px-3 py-2 text-sm text-gray-800 outline-none transition-colors placeholder:text-gray-500 focus:border-superteam-emerald dark:border-superteam-navy/55 dark:bg-[#091226] dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-superteam-yellow"
                />
                <button
                  type="submit"
                  className="rounded-lg border border-superteam-emerald/45 bg-superteam-emerald/12 px-4 py-2 text-sm font-semibold text-superteam-forest transition-colors hover:bg-superteam-emerald/20 dark:text-superteam-emerald dark:hover:bg-superteam-emerald/25"
                >
                  {t('footer.newsletterButton')}
                </button>
              </div>
              {newsletterSaved && (
                <p className="text-xs text-emerald-700 dark:text-emerald-300">
                  {t('footer.newsletterSuccess')}
                </p>
              )}
            </form>
          </div>
        </div>

        <div className="grid gap-10 border-b border-gray-200 pb-10 dark:border-superteam-navy/45 md:grid-cols-4">
          <div>
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
                {t('footer.onchainVerified')}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-superteam-navy/35 bg-superteam-navy/10 px-3 py-1 font-semibold text-superteam-navy dark:text-superteam-offwhite">
                {t('footer.communityFirst')}
              </span>
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-superteam-forest dark:text-superteam-yellow">
              {t('nav.courses')}
            </h3>
            <div className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
              <Link href="/courses" className="block hover:text-superteam-forest dark:hover:text-superteam-yellow">
                {t('footer.allCourses')}
              </Link>
              <Link href="/courses" className="block hover:text-superteam-forest dark:hover:text-superteam-yellow">
                {t('footer.learningPaths')}
              </Link>
              <Link href="/certificates" className="block hover:text-superteam-forest dark:hover:text-superteam-yellow">
                {t('footer.certifications')}
              </Link>
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-superteam-forest dark:text-superteam-yellow">
              {t('footer.community')}
            </h3>
            <div className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
              <a href="https://discord.gg/superteambrasil" target="_blank" rel="noopener noreferrer" className="block hover:text-superteam-forest dark:hover:text-superteam-yellow">
                Discord
              </a>
              <a href="https://x.com/SuperteamBR" target="_blank" rel="noopener noreferrer" className="block hover:text-superteam-forest dark:hover:text-superteam-yellow">
                Twitter
              </a>
              <a href="https://github.com/solanabr/superteam-academy" target="_blank" rel="noopener noreferrer" className="block hover:text-superteam-forest dark:hover:text-superteam-yellow">
                GitHub
              </a>
            </div>
            <div className="mt-4 flex gap-3">
              <a href="https://discord.gg/superteambrasil" target="_blank" rel="noopener noreferrer" aria-label="Discord" className="text-gray-500 transition-colors hover:text-superteam-forest dark:text-gray-400 dark:hover:text-superteam-yellow">
                <MessageCircle size={16} />
              </a>
              <a href="https://x.com/SuperteamBR" target="_blank" rel="noopener noreferrer" aria-label="Twitter" className="text-gray-500 transition-colors hover:text-superteam-forest dark:text-gray-400 dark:hover:text-superteam-yellow">
                <Twitter size={16} />
              </a>
              <a href="https://github.com/solanabr/superteam-academy" target="_blank" rel="noopener noreferrer" aria-label="GitHub" className="text-gray-500 transition-colors hover:text-superteam-forest dark:text-gray-400 dark:hover:text-superteam-yellow">
                <Github size={16} />
              </a>
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-superteam-forest dark:text-superteam-yellow">
              {t('footer.legal')}
            </h3>
            <div className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
              <Link href="/settings" className="block hover:text-superteam-forest dark:hover:text-superteam-yellow">
                {t('footer.terms')}
              </Link>
              <Link href="/settings" className="block hover:text-superteam-forest dark:hover:text-superteam-yellow">
                {t('footer.privacy')}
              </Link>
              <Link href="/settings" className="block hover:text-superteam-forest dark:hover:text-superteam-yellow">
                {t('footer.contact')}
              </Link>
            </div>
          </div>
        </div>

        <div className="pt-6 text-sm text-gray-500 dark:text-gray-400">
          <p>{t('footer.copyright').replace('2026', String(currentYear))}</p>
        </div>
      </div>
    </footer>
  )
}
