'use client'

import { useI18n } from '@/lib/hooks/useI18n'
import { Card, CardContent, CardHeader, Button } from '@/components/ui'
import Link from 'next/link'
import { useWallet } from '@/lib/hooks/useWallet'
import { useCredentials } from '@/lib/hooks/useXp'
import { PublicKey } from '@solana/web3.js'
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
    <main className="min-h-screen py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-display font-bold text-gray-900 dark:text-white mb-4">
            {t('profile.credentials')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl">
            {t('certificates.pageDesc') || 'View and share your earned credentials and certificates from completed tracks.'}
          </p>
        </div>

        {/* Not Connected State */}
        {!connected && (
          <Card className="mb-8">
            <CardContent className="pt-8 text-center space-y-4">
              <div className="text-6xl mb-4">🔗</div>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                {t('certificates.connectWallet') || 'Connect Your Wallet'}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                Connect your Solana wallet to view your on-chain credentials and certificates from devnet.
              </p>
              <Button variant="primary" onClick={openWalletModal}>
                {t('common.connectWallet')}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {connected && isLoading && (
          <Card className="mb-8">
            <CardContent className="pt-8 text-center space-y-4">
              <div className="text-4xl animate-spin">⏳</div>
              <p className="text-gray-600 dark:text-gray-400">
                {t('common.loading')}...
              </p>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {connected && !isLoading && credentials.length === 0 && (
          <Card className="mb-8">
            <CardContent className="pt-8 text-center space-y-4">
              <div className="text-6xl mb-4">🎓</div>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                {t('certificates.noCredentials') || 'No Credentials Yet'}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                Complete courses and tracks to earn certificates and credentials on-chain.
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
                <h2 className="text-2xl font-display font-bold text-gray-900 dark:text-white mb-6">
                  {trackCredentials[0]?.name?.split(' - ')[0] || `Track ${trackId}`}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {trackCredentials.map((credential) => (
                    <Card
                      key={credential.assetId}
                      className="hover:shadow-lg dark:hover:shadow-neon-cyan/20 transition-shadow"
                    >
                      <CardContent className="pt-6 pb-4">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <div className="text-3xl mb-2">🎓</div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                              Level {credential.level}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {credential.name}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-neon-cyan">
                              {credential.totalXp}
                            </div>
                            <p className="text-xs text-gray-500">XP</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Courses</p>
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {credential.coursesCompleted}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Issued</p>
                            <p className="font-semibold text-gray-900 dark:text-white text-xs">
                              {new Date(credential.mintedAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: '2-digit'
                              })}
                            </p>
                          </div>
                        </div>

                        <div className="bg-terminal-bg dark:bg-terminal-surface rounded p-2 mb-4 border border-terminal-border">
                          <p className="text-xs text-gray-500 dark:text-gray-400 break-all font-mono">
                            {credential.assetId}
                          </p>
                        </div>

                        <Link href={`/certificates/${credential.assetId}`} className="w-full">
                          <Button variant="primary" className="w-full text-sm">
                            {t('certificates.view') || 'View Details'}
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
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-4xl font-bold text-neon-cyan mb-2">
                  {credentials.length}
                </div>
                <p className="text-gray-600 dark:text-gray-400">
                  {t('certificates.totalCredentials') || 'Total Credentials'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-4xl font-bold text-neon-cyan mb-2">
                  {Math.max(...credentials.map(c => c.level), 0)}
                </div>
                <p className="text-gray-600 dark:text-gray-400">
                  {t('certificates.highestLevel') || 'Highest Level'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-4xl font-bold text-neon-cyan mb-2">
                  {credentials.reduce((sum, c) => sum + c.coursesCompleted, 0)}
                </div>
                <p className="text-gray-600 dark:text-gray-400">
                  {t('certificates.coursesCompleted') || 'Courses Completed'}
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </main>
  )
}
