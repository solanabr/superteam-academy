'use client'

import { useState } from 'react'
import { useRouter } from '@/i18n/routing'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { Transaction } from '@solana/web3.js'

interface CompleteAndNavigateButtonProps {
  lessonId: string
  lessonSlug?: string
  courseId: string
  courseTitle?: string
  xpEarned: number
  href: string
  issueCertificateOnComplete?: boolean
  children: React.ReactNode
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
}

type PopupState = {
  title: string
  message: string
  primaryLabel?: string
  secondaryLabel?: string
  onPrimary?: () => void
  onSecondary?: () => void
}

export function CompleteAndNavigateButton({
  lessonId,
  lessonSlug,
  courseId,
  courseTitle,
  xpEarned,
  href,
  issueCertificateOnComplete = false,
  children,
  variant = 'default',
  size = 'default',
  className
}: CompleteAndNavigateButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [popup, setPopup] = useState<PopupState | null>(null)
  const router = useRouter()
  const { connection } = useConnection()
  const { connected, publicKey, sendTransaction } = useWallet()

  const toErrorMessage = (err: unknown): string => {
    if (err instanceof Error) return err.message
    return String(err || 'Unknown error')
  }

  const isWalletSendError = (err: unknown): boolean => {
    const msg = toErrorMessage(err).toLowerCase()
    return (
      msg.includes('walletsendtransactionerror') ||
      msg.includes('sendtransaction') ||
      msg.includes('unexpected error') ||
      msg.includes('evmask')
    )
  }

  const showPopup = (state: PopupState) => {
    setPopup(state)
  }

  const closePopup = () => setPopup(null)

  const completeFlow = async (withCertificate: boolean) => {
    setLoading(true)
    setError(null)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      const url = typeof window !== 'undefined'
        ? `${window.location.origin}/api/lessons/complete`
        : '/api/lessons/complete'

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          lessonId,
          lessonSlug,
          courseId,
          xpEarned,
          issueCertificateOnComplete: withCertificate,
          courseTitle
        })
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) {
        const msg = payload?.error || 'Failed to save lesson progress'
        setError(msg)
        showPopup({
          title: 'Unable To Complete Lesson',
          message: msg,
          primaryLabel: 'Close',
          onPrimary: closePopup
        })
        return
      }

      if (!withCertificate) {
        router.push(href as any)
        return
      }

      if (payload?.certificateError) {
        const prefix = payload?.courseCompleted
          ? 'Course completed, but certificate was not minted'
          : 'Course is not fully completed yet'
        showPopup({
          title: 'Certificate Status',
          message: `${prefix}: ${payload.certificateError}`,
          primaryLabel: 'Continue',
          onPrimary: () => {
            closePopup()
            router.push(href as any)
          }
        })
        return
      }

      if (!payload?.courseCompleted) {
        const pct = typeof payload?.progressPercentage === 'number' ? payload.progressPercentage : null
        const message = pct !== null
          ? `Course is not fully completed yet (${pct}%). Complete all lessons first.${Array.isArray(payload?.missingLessonSlugs) && payload.missingLessonSlugs.length > 0 ? ` Missing: ${payload.missingLessonSlugs.join(', ')}` : ''}`
          : 'Course is not fully completed yet. Complete all lessons first.'

        showPopup({
          title: 'Course Not Completed',
          message,
          primaryLabel: 'Continue',
          onPrimary: () => {
            closePopup()
            router.push(href as any)
          }
        })
        return
      }

      let certificateReady = Boolean(payload?.certificate?.mintAddress && payload?.certificate?.signature)

      if (!certificateReady) {
        try {
          if (!connected || !publicKey) {
            showPopup({
              title: 'Wallet Required',
              message: 'Lesson progress was saved. Connect a Solana wallet (Phantom/Solflare) to mint your certificate.',
              primaryLabel: 'Continue',
              onPrimary: () => {
                closePopup()
                router.push(href as any)
              }
            })
            return
          }

          const prepareResponse = await fetch('/api/certificates/mint/prepare', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              courseId,
              walletAddress: publicKey.toBase58()
            })
          })
          const preparePayload = await prepareResponse.json().catch(() => ({}))

          if (!prepareResponse.ok) {
            const msg = preparePayload?.error || 'Failed to prepare certificate transaction'
            setError(msg)
            showPopup({
              title: 'Certificate Mint Failed',
              message: `Lesson progress was saved, but certificate mint failed: ${msg}`,
              primaryLabel: 'Continue',
              onPrimary: () => {
                closePopup()
                router.push(href as any)
              }
            })
            return
          }

          if (preparePayload?.alreadyIssued) {
            certificateReady = true
          } else {
            const serialized = preparePayload?.serializedTransaction as string | undefined
            const mintAddress = preparePayload?.mintAddress as string | undefined

            if (!serialized || !mintAddress) {
              showPopup({
                title: 'Certificate Mint Failed',
                message: 'Lesson progress was saved, but certificate transaction payload is invalid.',
                primaryLabel: 'Continue',
                onPrimary: () => {
                  closePopup()
                  router.push(href as any)
                }
              })
              return
            }

            const txBytes = Uint8Array.from(atob(serialized), (c) => c.charCodeAt(0))
            const transaction = Transaction.from(txBytes)
            const signature = await sendTransaction(transaction, connection, {
              skipPreflight: false,
              preflightCommitment: 'confirmed'
            })
            await connection.confirmTransaction(signature, 'confirmed')

            const confirmResponse = await fetch('/api/certificates/mint/confirm', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({
                courseId,
                mintAddress,
                signature
              })
            })
            const confirmPayload = await confirmResponse.json().catch(() => ({}))
            if (!confirmResponse.ok) {
              const msg = confirmPayload?.error || 'Failed to save certificate after minting'
              setError(msg)
              showPopup({
                title: 'Certificate Mint Failed',
                message: `Lesson progress was saved, but certificate mint failed: ${msg}`,
                primaryLabel: 'Continue',
                onPrimary: () => {
                  closePopup()
                  router.push(href as any)
                }
              })
              return
            }
            certificateReady = true
          }
        } catch (mintError) {
          const mintMessage = toErrorMessage(mintError)
          const walletHelp = isWalletSendError(mintError)
            ? 'Wallet transaction failed. Use a Solana wallet (Phantom/Solflare) and retry from Certificates page.'
            : mintMessage
          setError(walletHelp)
          showPopup({
            title: 'Certificate Mint Failed',
            message: `Lesson progress was saved, but certificate mint failed: ${walletHelp}`,
            primaryLabel: 'Continue',
            onPrimary: () => {
              closePopup()
              router.push(href as any)
            }
          })
          return
        }
      }

      if (certificateReady) {
        showPopup({
          title: 'Certificate Ready',
          message: 'Your course certificate is ready. Open Certificates now?',
          primaryLabel: 'Open Certificates',
          secondaryLabel: 'Continue',
          onPrimary: () => {
            closePopup()
            router.push('/certificates' as any)
          },
          onSecondary: () => {
            closePopup()
            router.push(href as any)
          }
        })
        return
      }

      router.push(href as any)
    } catch (err) {
      const message = toErrorMessage(err)
      setError(message)
      showPopup({
        title: 'Unable To Complete Lesson',
        message,
        primaryLabel: 'Close',
        onPrimary: closePopup
      })
    } finally {
      setLoading(false)
    }
  }

  const onClick = async () => {
    if (issueCertificateOnComplete) {
      setConfirmOpen(true)
      return
    }
    await completeFlow(false)
  }

  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={size}
        className={className}
        onClick={onClick}
        disabled={loading}
      >
        {children}
      </Button>
      {error && <span className="sr-only">{error}</span>}

      {confirmOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-background p-5">
            <h3 className="text-xl font-black">Get Certificate</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              You are completing this course. Do you want to get your certificate now?
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={loading}>
                Not Now
              </Button>
              <Button
                onClick={async () => {
                  setConfirmOpen(false)
                  await completeFlow(true)
                }}
                disabled={loading}
              >
                Get Certificate
              </Button>
            </div>
          </div>
        </div>
      )}

      {popup && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-background p-5">
            <h3 className="text-xl font-black">{popup.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">{popup.message}</p>
            <div className="mt-5 flex justify-end gap-2">
              {popup.secondaryLabel && (
                <Button variant="outline" onClick={popup.onSecondary || closePopup}>
                  {popup.secondaryLabel}
                </Button>
              )}
              <Button onClick={popup.onPrimary || closePopup}>
                {popup.primaryLabel || 'OK'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
