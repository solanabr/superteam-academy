'use client'

import { useI18n } from '@/lib/hooks/useI18n'
import { Card, CardContent, Button } from '@/components/ui'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useWallet } from '@/lib/hooks/useWallet'
import { useCredentials } from '@/lib/hooks/useXp'

export default function CertificatePage() {
  const { t } = useI18n()
  const params = useParams()
  const certificateId = params.id as string
  const { connected, publicKey, openWalletModal } = useWallet()
  const { data: credentials = [], isLoading } = useCredentials(publicKey || undefined)
  const credential = credentials.find((item) => item.assetId === certificateId)
  const verificationUrl = credential
    ? `https://explorer.solana.com/address/${credential.assetId}?cluster=devnet`
    : ''

  return (
    <main className="min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link href="/profile" className="text-neon-cyan hover:text-neon-cyan/70 mb-8 inline-block">
          ← {t('common.back')}
        </Link>

        {!connected && (
          <Card className="mb-8">
            <CardContent className="pt-8 text-center space-y-4">
              <p className="text-gray-600 dark:text-gray-400">
                Connect your wallet to verify this credential on devnet.
              </p>
              <Button variant="secondary" onClick={openWalletModal}>
                Connect Wallet
              </Button>
            </CardContent>
          </Card>
        )}

        {connected && isLoading && (
          <Card className="mb-8">
            <CardContent className="pt-8 text-center text-gray-600 dark:text-gray-400">
              Loading on-chain credential...
            </CardContent>
          </Card>
        )}

        {connected && !isLoading && !credential && (
          <Card className="mb-8">
            <CardContent className="pt-8 text-center text-gray-600 dark:text-gray-400">
              Credential not found for the connected wallet.
            </CardContent>
          </Card>
        )}

        {connected && !isLoading && credential && (
          <Card className="mb-8">
            <CardContent className="pt-8">
            {/* Certificate Display */}
            <div className="bg-gradient-to-br from-terminal-surface to-terminal-bg rounded-lg border-2 border-neon-cyan p-12 text-center mb-8">
              <div className="text-6xl mb-4">🎓</div>

              <h1 className="text-4xl font-display font-bold text-neon-cyan mb-4">
                {t('certificates.title')}
              </h1>

              <div className="text-gray-300 space-y-2 mb-8">
                <p className="text-lg font-semibold">{credential.name}</p>
                <p className="text-sm">
                  Issued on {new Date(credential.mintedAt).toLocaleDateString()}
                </p>
                <p className="text-sm">Level {credential.level}</p>
              </div>

              <div className="bg-terminal-bg rounded p-4 font-mono text-xs text-gray-400 overflow-auto">
                <span className="text-neon-green">Asset Address:</span> {credential.assetId}
              </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <Button
                variant="primary"
                className="w-full"
                onClick={() => window.open(verificationUrl, '_blank', 'noopener,noreferrer')}
              >
                {t('certificates.download')}
              </Button>
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => navigator.clipboard.writeText(window.location.href)}
              >
                {t('certificates.share')}
              </Button>
              <a href={verificationUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="secondary" className="w-full">
                  {t('certificates.verify')}
                </Button>
              </a>
            </div>

            {/* Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Certificate Details</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-400">Course</p>
                    <p className="text-white">{credential.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Issued Date</p>
                    <p className="text-white">{new Date(credential.mintedAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Level</p>
                    <p className="text-white">Level {credential.level}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Track</p>
                    <p className="text-white">{credential.trackId}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Courses Completed</p>
                    <p className="text-white">{credential.coursesCompleted}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-4">On-Chain Verification</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-400">Type</p>
                    <p className="text-neon-cyan">Compressed NFT (cNFT)</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Network</p>
                    <p className="text-white">Solana Devnet</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Verification</p>
                    <a
                      href={verificationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-neon-cyan hover:text-neon-cyan/70 break-all"
                    >
                      View on Solana Explorer
                    </a>
                  </div>
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
