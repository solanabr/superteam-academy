'use client';

import { use } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ExternalLink,
  Share2,
  Download,
  ArrowLeft,
  CheckCircle2,
  Shield,
  Calendar,
  Zap,
  Award,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { TRACK_INFO } from '@/config/constants';
import toast from 'react-hot-toast';

export default function CertificatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'My Solana Quest Credential',
        text: 'Check out my on-chain credential from Solana Quest!',
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="border-b border-border/40 gradient-quest">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
          <Link
            href="/profile"
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Profile
          </Link>
          <h1 className="text-3xl font-bold mb-2">Credential Verification</h1>
          <p className="text-muted-foreground">
            On-chain proof of your Solana development skills
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Certificate Visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="border-border/50 glow-purple overflow-hidden">
              <CardContent className="p-0">
                <div className="bg-gradient-to-br from-[#9945FF]/20 via-[#14F195]/10 to-[#00D1FF]/20 p-8 text-center">
                  {/* Certificate */}
                  <div className="bg-background/80 backdrop-blur-xl rounded-2xl border border-border/50 p-8">
                    <div className="flex justify-center mb-4">
                      <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[#9945FF] to-[#14F195] flex items-center justify-center text-4xl">
                        ⚡
                      </div>
                    </div>

                    <Badge variant="outline" className="mb-4 text-quest-gold border-quest-gold/30">
                      Verified Credential
                    </Badge>

                    <h2 className="text-xl font-bold mb-1">
                      Solana Fundamentals
                    </h2>
                    <p className="text-sm text-muted-foreground mb-4">
                      Track Level 3 &bull; Completed Jan 2026
                    </p>

                    <Separator className="my-4" />

                    <div className="text-center">
                      <p className="text-sm font-medium mb-1">Awarded to</p>
                      <p className="text-lg font-bold bg-gradient-to-r from-[#9945FF] to-[#14F195] bg-clip-text text-transparent">
                        Quest Hero
                      </p>
                    </div>

                    <Separator className="my-4" />

                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-lg font-bold">1,500</p>
                        <p className="text-xs text-muted-foreground">XP Earned</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold">10</p>
                        <p className="text-xs text-muted-foreground">Lessons</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold">3</p>
                        <p className="text-xs text-muted-foreground">Challenges</p>
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-border/50">
                      <p className="text-xs text-muted-foreground">
                        Powered by Solana &bull; Superteam Brazil
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Certificate Details */}
          <div className="space-y-6">
            <Card className="border-border/50">
              <CardContent className="p-6 space-y-4">
                <h3 className="font-bold flex items-center gap-2">
                  <Shield className="h-4 w-4 text-quest-health" />
                  Verification Details
                </h3>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Status</span>
                    <Badge className="bg-quest-health/10 text-quest-health border-quest-health/20">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Verified
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Type</span>
                    <span>Compressed NFT (cNFT)</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Network</span>
                    <span>Solana Devnet</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Mint Address</span>
                    <code className="text-xs bg-muted px-2 py-1 rounded">
                      5xot9...6Hkj
                    </code>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Issued</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      January 15, 2026
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Track</span>
                    <span className="flex items-center gap-1">
                      ⚡ Solana Fundamentals
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Track Level</span>
                    <span className="flex items-center gap-1">
                      <Award className="h-3 w-3 text-quest-gold" />
                      Level 3
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex gap-3">
              <a
                href="https://explorer.solana.com?cluster=devnet"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1"
              >
                <Button variant="outline" className="w-full gap-2">
                  <ExternalLink className="h-4 w-4" />
                  View on Explorer
                </Button>
              </a>
              <Button
                variant="outline"
                className="gap-2"
                onClick={handleShare}
              >
                <Share2 className="h-4 w-4" />
                Share
              </Button>
            </div>

            {/* NFT Metadata */}
            <Card className="border-border/50">
              <CardContent className="p-6">
                <h3 className="font-bold mb-3">NFT Metadata</h3>
                <pre className="bg-muted rounded-lg p-4 text-xs overflow-x-auto">
                  <code>
                    {JSON.stringify(
                      {
                        name: 'Solana Quest: Fundamentals Track',
                        description:
                          'Credential proving completion of the Solana Fundamentals track on Solana Quest',
                        image:
                          'https://solana-quest.vercel.app/credentials/fundamentals.png',
                        attributes: [
                          { trait_type: 'Track', value: 'Solana Fundamentals' },
                          { trait_type: 'Level', value: 3 },
                          { trait_type: 'XP', value: 1500 },
                          { trait_type: 'Courses Completed', value: 1 },
                          {
                            trait_type: 'Issued By',
                            value: 'Superteam Brazil',
                          },
                        ],
                      },
                      null,
                      2
                    )}
                  </code>
                </pre>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
