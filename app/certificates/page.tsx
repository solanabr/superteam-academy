'use client'

import { useI18n } from '@/lib/hooks/useI18n'
import { Card, CardContent, Button } from '@/components/ui'
import Link from 'next/link'
import { useWallet } from '@/lib/hooks/useWallet'
import { useCredentials } from '@/lib/hooks/useXp'
import { useMemo } from 'react'

export default function CertificatesPage() {
  const { t } = useI18n()
  const { connected, publicKey, openWalletModal } = useWallet()
  const { data: credentials = [], isLoading } = useCredentials(publicKey || undefined)

  const groupedByTrack = useMemo(() => {
    const grouped = credentials.reduce((acc, cred) => {
      if (!acc[cred.trackId]) {
        acc[cred.trackId] = []
      }
      acc[cred.trackId].push(cred)
      return acc
    }, {} as Record<string, typeof credentials>)

    // Sort each track's credentials by level descending
    Object.keys(grouped).forEach((trackId) => {
      grouped[trackId].sort((a, b) => b.level - a.level)
    })

    return grouped
  }, [credentials])

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-slate-50 via-white to-emerald-50/40 py-12 dark:from-[#060d1a] dark:via-[#071427] dark:to-[#091224]">
      <div className="pointer-events-none absolute -left-20 top-12 h-72 w-72 rounded-full bg-emerald-300/25 blur-3xl dark:bg-superteam-emerald/10" />
      <div className="pointer-events-none absolute -right-20 top-28 h-80 w-80 rounded-full bg-blue-300/25 blur-3xl dark:bg-superteam-navy/25" />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10 rounded-2xl border border-emerald-300/60 bg-gradient-to-r from-white via-slate-50 to-emerald-50/80 p-6 shadow-sm dark:border-superteam-emerald/30 dark:from-[#111e3a] dark:via-[#152345] dark:to-[#1a2849] dark:shadow-none">
          <h1 className="mb-3 text-4xl font-display font-bold text-slate-900 dark:text-superteam-offwhite">
            {t('profile.credentials')}
          </h1>
          <p className="max-w-2xl text-slate-600 dark:text-gray-300">
            {t('certificates.pageDesc')}
          </p>
        </div>

        {/* Not Connected State */}
        {!connected && (
          <Card className="mb-8 border-slate-300 bg-white/95 shadow-sm dark:border-superteam-navy/45 dark:bg-superteam-navy/35 dark:shadow-none">
            <CardContent className="space-y-4 py-8 text-center">
              <div className="text-6xl mb-4">🔗</div>
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-superteam-offwhite">
                {t('certificates.connectWallet')}
              </h2>
              <p className="mx-auto max-w-md text-slate-600 dark:text-gray-300">
                {t('certificates.connectWalletDesc')}
              </p>
              <Button variant="primary" onClick={openWalletModal}>
                {t('common.connectWallet')}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {connected && isLoading && (
          <Card className="mb-8 border-slate-300 bg-white/95 shadow-sm dark:border-superteam-navy/45 dark:bg-superteam-navy/35 dark:shadow-none">
            <CardContent className="space-y-4 py-8 text-center">
              <div className="text-4xl animate-spin">⏳</div>
              <p className="text-slate-600 dark:text-gray-300">
                {t('common.loading')}...
              </p>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {connected && !isLoading && credentials.length === 0 && (
          <Card className="mb-8 border-slate-300 bg-white/95 shadow-sm dark:border-superteam-navy/45 dark:bg-superteam-navy/35 dark:shadow-none">
            <CardContent className="space-y-4 py-8 text-center">
              <div className="text-6xl mb-4">🎓</div>
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-superteam-offwhite">
                {t('certificates.noCredentials')}
              </h2>
              <p className="mx-auto max-w-md text-slate-600 dark:text-gray-300">
                {t('certificates.noCredentialsDesc')}
              </p>
              <Link href="/courses">
                <Button variant="primary">
                  {t('nav.courses')}
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Credentials Grid */}
        {connected && !isLoading && credentials.length > 0 && (
          <div className="space-y-12">
            {Object.entries(groupedByTrack).map(([trackId, trackCredentials]) => (
              <div key={trackId}>
                <h2 className="mb-6 text-2xl font-display font-bold text-slate-900 dark:text-superteam-offwhite">
                  {trackCredentials[0]?.name?.split(' - ')[0] || `Track ${trackId}`}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {trackCredentials.map((credential) => (
                    <Card
                      key={credential.assetId}
                      className="border-slate-300 bg-white/95 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg dark:border-superteam-navy/45 dark:bg-[#0b1630]/90 dark:hover:shadow-neon-cyan/20"
                    >
                      <CardContent className="pt-6 pb-4">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <div className="text-3xl mb-2">🎓</div>
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-superteam-offwhite">
                              Level {credential.level}
                            </h3>
                            <p className="text-sm text-slate-600 dark:text-gray-300">
                              {credential.name}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-superteam-forest dark:text-neon-cyan">
                              {credential.totalXp}
                            </div>
                            <p className="text-xs text-slate-500 dark:text-gray-400">{t('certificates.xpLabel')}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
                          <div>
                            <p className="text-xs text-slate-500 dark:text-gray-400">{t('certificates.coursesLabel')}</p>
                            <p className="font-semibold text-slate-900 dark:text-gray-100">
                              {credential.coursesCompleted}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 dark:text-gray-400">{t('certificates.issuedLabel')}</p>
                            <p className="text-xs font-semibold text-slate-900 dark:text-gray-100">
                              {new Date(credential.mintedAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: '2-digit'
                              })}
                            </p>
                          </div>
                        </div>

                        <div className="mb-4 rounded border border-slate-300 bg-slate-100/75 p-2 dark:border-superteam-navy/45 dark:bg-[#091226]">
                          <p className="break-all font-mono text-xs text-slate-600 dark:text-gray-300">
                            {credential.assetId}
                          </p>
                        </div>

                        <Link href={`/certificates/${credential.assetId}`} className="w-full">
                          <Button variant="primary" className="w-full text-sm">
                            {t('certificates.view')}
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Stats Section */}
        {connected && !isLoading && credentials.length > 0 && (
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-slate-300 bg-white/95 shadow-sm dark:border-superteam-navy/45 dark:bg-superteam-navy/35 dark:shadow-none">
              <CardContent className="pt-6 text-center">
                <div className="mb-2 text-4xl font-bold text-superteam-forest dark:text-neon-cyan">
                  {credentials.length}
                </div>
                <p className="text-slate-600 dark:text-gray-300">
                  {t('certificates.totalCredentials')}
                </p>
              </CardContent>
            </Card>

            <Card className="border-slate-300 bg-white/95 shadow-sm dark:border-superteam-navy/45 dark:bg-superteam-navy/35 dark:shadow-none">
              <CardContent className="pt-6 text-center">
                <div className="mb-2 text-4xl font-bold text-superteam-forest dark:text-neon-cyan">
                  {Math.max(...credentials.map(c => c.level), 0)}
                </div>
                <p className="text-slate-600 dark:text-gray-300">
                  {t('certificates.highestLevel')}
                </p>
              </CardContent>
            </Card>

            <Card className="border-slate-300 bg-white/95 shadow-sm dark:border-superteam-navy/45 dark:bg-superteam-navy/35 dark:shadow-none">
              <CardContent className="pt-6 text-center">
                <div className="mb-2 text-4xl font-bold text-superteam-forest dark:text-neon-cyan">
                  {credentials.reduce((sum, c) => sum + c.coursesCompleted, 0)}
                </div>
                <p className="text-slate-600 dark:text-gray-300">
                  {t('certificates.coursesCompleted')}
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </main>
  )
}
