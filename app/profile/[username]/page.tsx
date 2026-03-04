'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, Button } from '@/components/ui'
import { useI18n } from '@/lib/hooks/useI18n'
import { Award, CalendarClock, Flame, ShieldCheck } from 'lucide-react'

interface PublicProfileUser {
  id: string
  email?: string
  displayName?: string
  bio?: string
  avatarUrl?: string
  walletAddress?: string
  totalXP: number
  level: number
  currentStreak: number
  longestStreak: number
  createdAt: string
}

function formatAddress(address: string): string {
  if (address.length <= 10) return address
  return `${address.slice(0, 4)}...${address.slice(-4)}`
}

export default function PublicProfilePage() {
  const params = useParams()
  const { t } = useI18n()
  const usernameParam = params.username
  const username = typeof usernameParam === 'string' ? usernameParam : ''
  const [profile, setProfile] = useState<PublicProfileUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function loadProfile() {
      if (!username) {
        setProfile(null)
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const response = await fetch(`/api/users/${encodeURIComponent(username)}/profile`, {
          cache: 'no-store',
        })

        if (!response.ok) {
          if (!cancelled) {
            setProfile(null)
          }
          return
        }

        const data = (await response.json()) as PublicProfileUser
        if (!cancelled) {
          setProfile(data)
        }
      } catch {
        if (!cancelled) {
          setProfile(null)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadProfile()

    return () => {
      cancelled = true
    }
  }, [username])

  const memberSince = useMemo(() => {
    if (!profile?.createdAt) return null
    const date = new Date(profile.createdAt)
    return Number.isNaN(date.getTime()) ? null : date
  }, [profile?.createdAt])

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-emerald-50/40 py-12 dark:from-[#060d1a] dark:via-[#071427] dark:to-[#091224]">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6 h-48 animate-pulse rounded-2xl border border-slate-200 bg-white/90 dark:border-superteam-navy/40 dark:bg-superteam-navy/30" />
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map((index) => (
              <div
                key={`public-profile-skeleton-${index}`}
                className="h-24 animate-pulse rounded-xl border border-slate-200 bg-white/90 dark:border-superteam-navy/40 dark:bg-superteam-navy/30"
              />
            ))}
          </div>
        </div>
      </main>
    )
  }

  if (!profile) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-emerald-50/40 py-12 dark:from-[#060d1a] dark:via-[#071427] dark:to-[#091224]">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <Card className="border-slate-300 bg-white/95 shadow-sm dark:border-superteam-navy/45 dark:bg-superteam-navy/35 dark:shadow-none">
            <CardContent className="py-12">
              <h1 className="mb-3 text-4xl font-display font-bold text-slate-900 dark:text-superteam-offwhite">
                {t('profile.notFound')}
              </h1>
              <p className="mb-6 text-slate-600 dark:text-gray-300">
                {t('common.noData')}
              </p>
              <Link href="/leaderboard">
                <Button>{t('nav.leaderboard')}</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>
    )
  }

  const displayName = profile.displayName || t('profile.anonymousLearner')
  const walletLabel = profile.walletAddress ? formatAddress(profile.walletAddress) : t('profile.notSet')
  const statCards = [
    {
      label: t('dashboard.stats.level'),
      value: String(profile.level),
      className: 'text-blue-700 dark:text-neon-cyan',
      icon: <Award size={14} />,
    },
    {
      label: t('profile.totalXp'),
      value: profile.totalXP.toLocaleString(),
      className: 'text-superteam-forest dark:text-superteam-yellow',
      icon: <Award size={14} />,
    },
    {
      label: t('dashboard.stats.streak'),
      value: String(profile.currentStreak),
      className: 'text-orange-600 dark:text-orange-300',
      icon: <Flame size={14} />,
    },
    {
      label: t('profile.longest'),
      value: String(profile.longestStreak),
      className: 'text-emerald-700 dark:text-emerald-300',
      icon: <ShieldCheck size={14} />,
    },
  ]

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-slate-50 via-white to-emerald-50/40 py-12 dark:from-[#060d1a] dark:via-[#071427] dark:to-[#091224]">
      <div className="pointer-events-none absolute -left-20 top-32 h-72 w-72 rounded-full bg-emerald-300/25 blur-3xl dark:bg-superteam-emerald/10" />
      <div className="pointer-events-none absolute -right-20 top-24 h-72 w-72 rounded-full bg-blue-300/20 blur-3xl dark:bg-superteam-navy/25" />

      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <Card className="mb-6 border-slate-300 bg-white/95 shadow-sm dark:border-superteam-navy/45 dark:bg-[#0c1730]/85 dark:shadow-none">
          <CardContent className="pt-6">
            <div className="flex flex-col gap-6 md:flex-row md:items-start">
              <div className="flex h-24 w-24 items-center justify-center rounded-2xl border border-blue-300 bg-gradient-to-br from-blue-500 to-purple-600 text-4xl font-bold text-white shadow-sm dark:border-superteam-emerald/40 dark:shadow-none">
                {displayName[0]?.toUpperCase() || 'U'}
              </div>

              <div className="flex-1">
                <h1 className="text-3xl font-display font-bold text-slate-900 dark:text-superteam-offwhite">
                  {displayName}
                </h1>
                <p className="mt-1 text-slate-600 dark:text-gray-300">
                  @{username}
                </p>

                <div className="mt-4 flex flex-wrap gap-2 text-xs">
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 font-semibold text-emerald-800 dark:border-superteam-emerald/45 dark:bg-superteam-emerald/10 dark:text-superteam-emerald">
                    <CalendarClock size={12} />
                    {memberSince ? memberSince.toLocaleDateString() : t('profile.unknown')}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full border border-blue-300 bg-blue-50 px-3 py-1 font-semibold text-blue-800 dark:border-superteam-navy/60 dark:bg-superteam-navy/35 dark:text-superteam-offwhite">
                    {walletLabel}
                  </span>
                </div>

                <p className="mt-4 text-slate-700 dark:text-gray-200">
                  {profile.bio || t('profile.noBioYet')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          {statCards.map((card) => (
            <Card
              key={card.label}
              hover={false}
              className="border-slate-300 bg-white/95 shadow-sm dark:border-superteam-navy/45 dark:bg-superteam-navy/35 dark:shadow-none"
            >
              <CardContent className="pt-6">
                <p className="mb-2 inline-flex items-center gap-1 text-xs uppercase tracking-wide text-slate-500 dark:text-gray-400">
                  {card.icon}
                  {card.label}
                </p>
                <p className={`text-2xl font-display font-bold ${card.className}`}>
                  {card.value}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-slate-300 bg-white/95 shadow-sm dark:border-superteam-navy/45 dark:bg-[#0c1730]/85 dark:shadow-none">
          <CardHeader>
            <h2 className="text-xl font-display font-bold text-slate-900 dark:text-superteam-offwhite">
              {t('profile.memberSince')}
            </h2>
          </CardHeader>
          <CardContent>
            <p className="text-slate-800 dark:text-gray-200">
              {memberSince ? memberSince.toLocaleDateString() : t('profile.unknown')}
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
