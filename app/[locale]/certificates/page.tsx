'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BlockchainService, type Credential } from '@/lib/services/blockchain.service'
import { useTranslations } from 'next-intl'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { 
  Award, 
  ExternalLink, 
  ShieldCheck, 
  Calendar, 
  User as UserIcon, 
  Hash, 
  Loader2,
  Trophy,
  Wallet
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Link } from '@/i18n/routing'
import Image from 'next/image'

export default function CertificatesPage() {
  const [credentials, setCredentials] = useState<Credential[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [username, setUsername] = useState('')
  const { publicKey, connected } = useWallet()
  
  const t = useTranslations('Certificates')
  const blockchainService = new BlockchainService()
  const supabase = createClient()

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setIsLoading(false)
        return
      }

      // Fetch profile for username and wallet_address
      const { data: profile } = await supabase
        .from('profiles')
        .select('username, wallet_address')
        .eq('id', user.id)
        .single()
      
      if (profile) setUsername(profile.username || user.email?.split('@')[0] || '')

      // Use either the profile's wallet or the currently connected one
      const walletToUse = profile?.wallet_address || (connected && publicKey ? publicKey.toString() : null)

      if (walletToUse) {
        const userCredentials = await blockchainService.getUserCredentials(walletToUse)
        setCredentials(userCredentials)
      } else {
        setCredentials([])
      }
      
      setIsLoading(false)
    }

    loadData()
  }, [connected, publicKey, supabase])

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="container py-12 max-w-6xl space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight flex items-center gap-3">
            <Award className="h-10 w-10 text-primary" />
            {t('title')}
          </h1>
          <p className="text-lg text-muted-foreground">
            {t('subtitle')}
          </p>
        </div>
      </div>

      {credentials.length === 0 ? (
        <Card className="border-dashed border-2 bg-card/30 flex flex-col items-center justify-center py-20 text-center space-y-6">
          <div className="bg-primary/10 p-4 rounded-full">
            <Trophy className="h-12 w-12 text-primary/40" />
          </div>
          <div className="space-y-2 px-4">
            <h3 className="text-2xl font-bold">{t('noCertificates')}</h3>
            <p className="text-muted-foreground max-w-sm mx-auto">
              {!connected ? (
                "Connect your Solana wallet to view your verified on-chain credentials."
              ) : (
                t('startLearning')
              )}
            </p>
          </div>
          {!connected ? (
            <div className="flex flex-col items-center gap-4">
              <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Recommended</p>
              <div className="bg-primary rounded-xl overflow-hidden shadow-lg shadow-primary/20 hover:scale-105 transition-transform">
                <WalletMultiButton />
              </div>
            </div>
          ) : (
            <Button asChild className="mt-4 rounded-xl font-bold px-8 py-6 text-lg shadow-lg shadow-primary/20">
              <Link href="/courses">Explore Courses</Link>
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {credentials.map((cert) => (
            <Card key={cert.id} className="group overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/50 transition-all duration-300 flex flex-col h-full">
              <div className="relative aspect-video overflow-hidden bg-muted">
                {cert.imageUrl ? (
                  <Image
                    src={cert.imageUrl}
                    alt={cert.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      // Fallback if image fails
                      (e.target as any).src = 'https://via.placeholder.com/600x400/101010/00FFA3?text=Solana+Certificate'
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
                    <Award className="h-16 w-16 text-primary/40" />
                  </div>
                )}
                <div className="absolute top-3 right-3">
                  <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-primary/30 flex items-center gap-1.5 shadow-xl">
                    <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                      {t('verified')}
                    </span>
                  </div>
                </div>
              </div>

              <CardHeader>
                <CardTitle className="line-clamp-1 group-hover:text-primary transition-colors">
                  {cert.title}
                </CardTitle>
                <CardDescription className="line-clamp-2 min-h-[40px]">
                  {cert.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="flex-grow space-y-4">
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1.5">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <UserIcon className="h-3 w-3" />
                      {t('issuedTo')}
                    </span>
                    <p className="font-semibold text-foreground truncate">
                      {username}
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {t('issueDate')}
                    </span>
                    <p className="font-semibold text-foreground">
                      {new Date(cert.metadata.earnedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {cert.metadata.mint && (
                  <div className="space-y-1.5 pt-2 border-t border-border/50">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Hash className="h-3 w-3" />
                      {t('mintAddress')}
                    </span>
                    <p className="text-[10px] font-mono bg-muted/50 p-1.5 rounded text-muted-foreground truncate">
                      {cert.metadata.mint}
                    </p>
                  </div>
                )}
              </CardContent>

              <CardFooter className="pt-0">
                <Button variant="outline" className="w-full rounded-xl border-primary/20 hover:bg-primary/10 hover:border-primary/50 group/btn" asChild>
                  <a href={`https://solscan.io/token/${cert.metadata.mint}?cluster=devnet`} target="_blank" rel="noopener noreferrer">
                    {t('viewOnSolscan')}
                    <ExternalLink className="ml-2 h-4 w-4 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                  </a>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
