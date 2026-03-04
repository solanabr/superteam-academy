'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowLeft, BadgeCheck, Copy, Download, ExternalLink, Share2 } from 'lucide-react'
import type { Credential } from '@/lib/services/credential.service'
import { useI18n } from '@/lib/hooks/useI18n'
import { Card, CardContent, Button } from '@/components/ui'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useWallet } from '@/lib/hooks/useWallet'
import { useCredentials } from '@/lib/hooks/useXp'

function formatDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString()
}

function toAssetLabel(value: string): string {
  if (value.length <= 18) return value
  return `${value.slice(0, 8)}...${value.slice(-8)}`
}

function escapeSvgText(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function buildCertificateSvg(credential: Credential): string {
  const issuedDate = formatDate(credential.mintedAt)
  const safeName = escapeSvgText(credential.name)
  const safeTrack = escapeSvgText(credential.trackId)
  const safeAsset = escapeSvgText(credential.assetId)

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900" role="img" aria-label="Superteam credential">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0e1d3a" />
      <stop offset="55%" stop-color="#152c57" />
      <stop offset="100%" stop-color="#1e4b43" />
    </linearGradient>
    <linearGradient id="line" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#17f1ff" />
      <stop offset="100%" stop-color="#9b5cff" />
    </linearGradient>
  </defs>

  <rect width="1600" height="900" fill="url(#bg)" rx="36" />
  <rect x="40" y="40" width="1520" height="820" fill="none" stroke="url(#line)" stroke-width="2" rx="28" />

  <text x="90" y="150" fill="#17f1ff" font-size="30" font-family="Inter, Arial, sans-serif" letter-spacing="3">SUPERTEAM ACADEMY</text>
  <text x="90" y="220" fill="#f4f1e6" font-size="80" font-weight="700" font-family="Inter, Arial, sans-serif">On-Chain Credential</text>
  <text x="90" y="280" fill="#b8c4dd" font-size="34" font-family="Inter, Arial, sans-serif">Issued on Solana Devnet</text>

  <text x="90" y="390" fill="#8ea1bf" font-size="30" font-family="Inter, Arial, sans-serif">Track</text>
  <text x="90" y="440" fill="#f4f1e6" font-size="48" font-weight="600" font-family="Inter, Arial, sans-serif">${safeTrack}</text>

  <text x="90" y="530" fill="#8ea1bf" font-size="30" font-family="Inter, Arial, sans-serif">Credential</text>
  <text x="90" y="580" fill="#f4f1e6" font-size="48" font-weight="600" font-family="Inter, Arial, sans-serif">${safeName}</text>

  <text x="90" y="670" fill="#8ea1bf" font-size="30" font-family="Inter, Arial, sans-serif">Issued</text>
  <text x="90" y="720" fill="#17f1ff" font-size="42" font-weight="700" font-family="Inter, Arial, sans-serif">${issuedDate}</text>

  <rect x="980" y="320" width="500" height="260" rx="24" fill="#0b1731" stroke="#17f1ff" stroke-opacity="0.45" />
  <text x="1020" y="395" fill="#8ea1bf" font-size="30" font-family="Inter, Arial, sans-serif">Level</text>
  <text x="1020" y="450" fill="#17f1ff" font-size="72" font-weight="800" font-family="Inter, Arial, sans-serif">${credential.level}</text>
  <text x="1020" y="525" fill="#f4f1e6" font-size="36" font-family="Inter, Arial, sans-serif">${credential.totalXp.toLocaleString()} XP</text>

  <text x="90" y="820" fill="#6f83a3" font-size="24" font-family="Menlo, Consolas, monospace">${safeAsset}</text>
</svg>`
}

export default function CertificatePage() {
  const { t } = useI18n()
  const params = useParams()
  const certificateIdParam = params.id
  const certificateId = typeof certificateIdParam === 'string' ? certificateIdParam : ''
  const { connected, publicKey, openWalletModal } = useWallet()
  const { data: credentials = [], isLoading } = useCredentials(publicKey || undefined)
  const credential = credentials.find((item) => item.assetId === certificateId)
  const [actionMessage, setActionMessage] = useState<string | null>(null)
  const verificationUrl = credential
    ? `https://explorer.solana.com/address/${credential.assetId}?cluster=devnet`
    : ''
  const issuedDate = useMemo(
    () => (credential ? formatDate(credential.mintedAt) : ''),
    [credential]
  )

  useEffect(() => {
    if (!actionMessage) return
    const timer = window.setTimeout(() => setActionMessage(null), 2200)
    return () => window.clearTimeout(timer)
  }, [actionMessage])

  const handleDownload = useCallback(() => {
    if (!credential) return

    const svg = buildCertificateSvg(credential)
    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })
    const downloadUrl = URL.createObjectURL(blob)
    const fileBase = credential.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = `${fileBase || 'credential'}-level-${credential.level}.svg`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(downloadUrl)
    setActionMessage(`${t('certificates.download')} ✓`)
  }, [credential, t])

  const handleShare = useCallback(async () => {
    if (!credential) return

    const shareUrl = window.location.href
    const shareText = `${credential.name} • Level ${credential.level} • ${credential.totalXp} XP`

    if (navigator.share) {
      try {
        await navigator.share({
          title: credential.name,
          text: shareText,
          url: shareUrl,
        })
        return
      } catch {
        // If system share is cancelled/blocked, fallback to clipboard.
      }
    }

    await navigator.clipboard.writeText(shareUrl)
    setActionMessage(`${t('certificates.share')} ✓`)
  }, [credential, t])

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-slate-50 via-white to-emerald-50/40 py-12 dark:from-[#060d1a] dark:via-[#071427] dark:to-[#091224]">
      <div className="pointer-events-none absolute -left-24 top-20 h-72 w-72 rounded-full bg-emerald-300/30 blur-3xl dark:bg-superteam-emerald/10" />
      <div className="pointer-events-none absolute -right-16 top-24 h-80 w-80 rounded-full bg-blue-300/25 blur-3xl dark:bg-superteam-navy/25" />

      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <Link
          href="/certificates"
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-800 dark:text-neon-cyan dark:hover:text-neon-cyan/80"
        >
          <ArrowLeft size={14} />
          {t('common.back')}
        </Link>

        {!connected && (
          <Card className="mb-8 border-slate-300 bg-white/95 shadow-sm dark:border-superteam-navy/45 dark:bg-superteam-navy/35 dark:shadow-none">
            <CardContent className="space-y-4 py-10 text-center">
              <p className="text-slate-700 dark:text-gray-300">
                {t('certificates.connectForVerify')}
              </p>
              <Button variant="secondary" onClick={openWalletModal}>
                {t('common.connectWallet')}
              </Button>
            </CardContent>
          </Card>
        )}

        {connected && isLoading && (
          <Card className="mb-8 border-slate-300 bg-white/95 shadow-sm dark:border-superteam-navy/45 dark:bg-superteam-navy/35 dark:shadow-none">
            <CardContent className="py-10 text-center text-slate-600 dark:text-gray-300">
              {t('certificates.loadingCredential')}
            </CardContent>
          </Card>
        )}

        {connected && !isLoading && !credential && (
          <Card className="mb-8 border-slate-300 bg-white/95 shadow-sm dark:border-superteam-navy/45 dark:bg-superteam-navy/35 dark:shadow-none">
            <CardContent className="py-10 text-center text-slate-700 dark:text-gray-300">
              {t('certificates.credentialNotFound')}
            </CardContent>
          </Card>
        )}

        {connected && !isLoading && credential && (
          <Card className="mb-8 border-slate-300 bg-white/95 shadow-sm dark:border-superteam-navy/45 dark:bg-[#0c1730]/85 dark:shadow-none">
            <CardContent className="pt-6">
              <div className="mb-6 rounded-2xl border border-emerald-300/60 bg-gradient-to-br from-white via-slate-50 to-emerald-50/90 p-7 dark:border-superteam-emerald/35 dark:from-[#102143] dark:via-[#13244a] dark:to-[#16304d]">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-400/60 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-800 dark:border-superteam-yellow/50 dark:bg-superteam-yellow/10 dark:text-superteam-yellow">
                  <BadgeCheck size={13} />
                  {t('certificates.verification')}
                </div>

                <h1 className="text-3xl font-display font-bold text-slate-900 dark:text-superteam-offwhite">
                  {credential.name}
                </h1>
                <p className="mt-2 text-sm text-slate-600 dark:text-gray-300">
                  {t('certificates.issuedOn')} {issuedDate}
                </p>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-lg border border-blue-300/60 bg-white/85 p-3 dark:border-superteam-navy/55 dark:bg-[#0b1630]/80">
                    <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-gray-400">{t('leaderboard.level')}</p>
                    <p className="text-xl font-bold text-blue-800 dark:text-superteam-emerald">
                      {credential.level}
                    </p>
                  </div>
                  <div className="rounded-lg border border-amber-300/60 bg-white/85 p-3 dark:border-superteam-yellow/55 dark:bg-[#0b1630]/80">
                    <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-gray-400">{t('certificates.xpLabel')}</p>
                    <p className="text-xl font-bold text-superteam-forest dark:text-superteam-yellow">
                      {credential.totalXp.toLocaleString()}
                    </p>
                  </div>
                  <div className="rounded-lg border border-emerald-300/60 bg-white/85 p-3 dark:border-superteam-emerald/55 dark:bg-[#0b1630]/80">
                    <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-gray-400">{t('certificates.coursesCompleted')}</p>
                    <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300">
                      {credential.coursesCompleted}
                    </p>
                  </div>
                </div>

                <div className="mt-5 rounded-lg border border-slate-300 bg-white/85 p-3 text-xs font-mono text-slate-700 dark:border-superteam-navy/45 dark:bg-[#0b1630]/80 dark:text-gray-300">
                  <span className="font-semibold text-slate-800 dark:text-superteam-offwhite">{t('certificates.assetAddress')}</span>{' '}
                  {credential.assetId}
                </div>
              </div>

              <div className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-3">
                <Button
                  variant="primary"
                  className="w-full"
                  onClick={handleDownload}
                >
                  <Download size={15} className="mr-2" />
                  {t('certificates.download')}
                </Button>
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={handleShare}
                >
                  <Share2 size={15} className="mr-2" />
                  {t('certificates.share')}
                </Button>
                <a href={verificationUrl} target="_blank" rel="noopener noreferrer">
                  <Button variant="secondary" className="w-full">
                    <ExternalLink size={15} className="mr-2" />
                    {t('certificates.verify')}
                  </Button>
                </a>
              </div>

              {actionMessage && (
                <p className="mb-6 inline-flex items-center gap-1 rounded-md border border-emerald-300 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 dark:border-superteam-emerald/45 dark:bg-superteam-emerald/10 dark:text-superteam-emerald">
                  <Copy size={12} />
                  {actionMessage}
                </p>
              )}

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="rounded-xl border border-slate-300 bg-white/95 p-5 dark:border-superteam-navy/45 dark:bg-[#0b1630]/90">
                  <h3 className="mb-4 text-lg font-semibold text-slate-900 dark:text-superteam-offwhite">
                    {t('certificates.certificateDetails')}
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-gray-400">{t('certificates.course')}</p>
                      <p className="text-slate-900 dark:text-gray-100">{credential.name}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-gray-400">{t('certificates.issuedDate')}</p>
                      <p className="text-slate-900 dark:text-gray-100">{issuedDate}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-gray-400">{t('leaderboard.level')}</p>
                      <p className="text-slate-900 dark:text-gray-100">{credential.level}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-gray-400">{t('profile.track')}</p>
                      <p className="text-slate-900 dark:text-gray-100">{credential.trackId}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-gray-400">{t('certificates.coursesCompleted')}</p>
                      <p className="text-slate-900 dark:text-gray-100">{credential.coursesCompleted}</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-300 bg-white/95 p-5 dark:border-superteam-navy/45 dark:bg-[#0b1630]/90">
                  <h3 className="mb-4 text-lg font-semibold text-slate-900 dark:text-superteam-offwhite">
                    {t('certificates.onChainVerification')}
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-gray-400">{t('certificates.typeLabel')}</p>
                      <p className="text-blue-700 dark:text-neon-cyan">{t('certificates.compressedNft')}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-gray-400">{t('certificates.networkLabel')}</p>
                      <p className="text-slate-900 dark:text-gray-100">{t('certificates.solanaDevnet')}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-gray-400">{t('certificates.assetAddress')}</p>
                      <p className="font-mono text-xs text-slate-700 dark:text-gray-300">
                        {toAssetLabel(credential.assetId)}
                      </p>
                    </div>
                    <a
                      href={verificationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm font-semibold text-blue-700 hover:text-blue-800 dark:text-neon-cyan dark:hover:text-neon-cyan/80"
                    >
                      {t('certificates.viewExplorer')}
                      <ExternalLink size={14} />
                    </a>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  )
}
