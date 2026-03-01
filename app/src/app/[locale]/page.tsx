'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import {
  GraduationCap,
  Sparkles,
  Shield,
  Code,
  Users,
  BookOpen,
  Award,
  Zap,
  ArrowRight,
  ChevronRight,
} from 'lucide-react';

export default function HomePage() {
  const t = useTranslations('home');
  const tc = useTranslations('common');
  const { connected } = useWallet();
  const { setVisible } = useWalletModal();

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-solana-purple/10 via-transparent to-transparent" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-solana-purple/5 rounded-full blur-3xl" />

        <div className="container relative py-24 md:py-32 lg:py-40">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center gap-2 bg-solana-purple/10 border border-solana-purple/20 rounded-full px-4 py-1.5 text-sm text-solana-purple">
              <Zap className="h-3.5 w-3.5" />
              Powered by Solana Devnet
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-solana-purple via-solana-blue to-solana-green bg-clip-text text-transparent">
                {t('hero.title')}
              </span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              {t('hero.subtitle')}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {connected ? (
                <Link href="/courses">
                  <Button variant="solana" size="lg" className="gap-2 text-base">
                    {t('hero.exploreCourses')}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              ) : (
                <Button
                  variant="solana"
                  size="lg"
                  className="gap-2 text-base"
                  onClick={() => setVisible(true)}
                >
                  {t('hero.cta')}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              )}
              <Link href="/courses">
                <Button variant="outline" size="lg" className="gap-2 text-base">
                  {t('hero.exploreCourses')}
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y bg-muted/30">
        <div className="container py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { label: t('stats.totalLearners'), value: '250+', icon: Users },
              { label: t('stats.coursesAvailable'), value: '6', icon: BookOpen },
              { label: t('stats.credentialsIssued'), value: '120+', icon: Award },
              { label: t('stats.totalXpDistributed'), value: '500K+', icon: Sparkles },
            ].map((stat) => (
              <div key={stat.label} className="text-center space-y-2">
                <stat.icon className="h-6 w-6 mx-auto text-solana-purple" />
                <p className="text-3xl font-bold bg-gradient-to-r from-solana-purple to-solana-green bg-clip-text text-transparent">
                  {stat.value}
                </p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container py-20">
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: Shield,
              title: t('features.onChainTitle'),
              description: t('features.onChainDesc'),
              gradient: 'from-purple-500/20 to-purple-600/5',
            },
            {
              icon: Sparkles,
              title: t('features.xpTitle'),
              description: t('features.xpDesc'),
              gradient: 'from-yellow-500/20 to-yellow-600/5',
            },
            {
              icon: Code,
              title: t('features.codeTitle'),
              description: t('features.codeDesc'),
              gradient: 'from-green-500/20 to-green-600/5',
            },
          ].map((feature) => (
            <Card
              key={feature.title}
              className="group hover:border-solana-purple/30 transition-all duration-300"
            >
              <CardContent className="pt-6 space-y-4">
                <div
                  className={`w-12 h-12 rounded-lg bg-gradient-to-br ${feature.gradient} flex items-center justify-center`}
                >
                  <feature.icon className="h-6 w-6 text-solana-purple" />
                </div>
                <h3 className="text-lg font-semibold">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="border-t bg-muted/20">
        <div className="container py-20">
          <h2 className="text-3xl font-bold text-center mb-12">
            How It Works
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: '01', title: 'Connect Wallet', desc: 'Link your Solana wallet to start your learning journey' },
              { step: '02', title: 'Enroll in Courses', desc: 'Choose from beginner to advanced Solana development tracks' },
              { step: '03', title: 'Learn & Earn XP', desc: 'Complete lessons and code challenges to earn soulbound XP tokens' },
              { step: '04', title: 'Get Credentials', desc: 'Receive verifiable Metaplex Core NFT credentials in your wallet' },
            ].map((item) => (
              <div key={item.step} className="space-y-3">
                <span className="text-4xl font-bold text-solana-purple/30">
                  {item.step}
                </span>
                <h3 className="text-lg font-semibold">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
