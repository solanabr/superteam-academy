import { Link } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { CourseCard } from '@/components/course/course-card';
import { ArrowRight, BookOpen, Trophy, Users, Zap, Shield, Globe, Star, Rocket, Code, Sparkles } from 'lucide-react';
import { courseService } from '@/lib/services/course.service';
import { getTranslations } from 'next-intl/server';

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const featuredCourses = await courseService.getCourses({ difficulty: 'beginner' });
  const topCourses = featuredCourses.slice(0, 3);
  
  const t = await getTranslations('Landing');
  const commonT = await getTranslations('Common');

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-background">
        {/* Advanced Background Effects */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(20,241,149,0.08)_0%,transparent_70%)]" />
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px] animate-pulse opacity-50" />
          <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-accent/15 rounded-full blur-[150px] animate-pulse delay-1000 opacity-50" />
          <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:radial-gradient(ellipse_at_center,white,transparent_75%)] opacity-20" />
        </div>

        <div className="container relative z-10 py-20">
          <div className="mx-auto max-w-5xl text-center space-y-12">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-5 py-2 text-xs sm:text-sm font-bold text-primary backdrop-blur-md animate-in fade-in slide-in-from-bottom-4 duration-1000">
              <Zap className="h-4 w-4 fill-primary animate-pulse" />
              <span className="uppercase tracking-widest">{commonT('home')} • Open Source Learning Platform</span>
            </div>
            
            <div className="space-y-6">
              <h1 className="text-4xl font-black tracking-tighter sm:text-6xl lg:text-7xl text-balance leading-[0.95] animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
                {t('heroTitle')}
              </h1>
              
              <p className="mx-auto max-w-2xl text-base md:text-lg text-muted-foreground text-balance leading-relaxed font-medium animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
                {t('heroSubtitle')}
              </p>
            </div>
            
            <div className="flex flex-wrap items-center justify-center gap-6 pt-8 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-500">
              <Button size="lg" asChild className="h-14 px-8 text-lg font-black rounded-2xl bg-primary text-primary-foreground shadow-[0_0_30px_rgba(20,241,149,0.3)] hover:shadow-[0_0_50px_rgba(20,241,149,0.5)] hover:scale-105 transition-all duration-300">
                <Link href="/auth/sign-up">
                  <BookOpen className="mr-3 h-6 w-6" />
                  {t('startLearning')}
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="h-14 px-8 text-lg font-black border-2 rounded-2xl bg-background/50 backdrop-blur-sm hover:bg-white/5 transition-all duration-300">
                <Link href="/courses">
                  {t('viewCourses')}
                  <ArrowRight className="ml-3 h-6 w-6" />
                </Link>
              </Button>
            </div>

            {/* Stats / Social Proof */}
            <div className="pt-20 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto animate-in fade-in duration-1000 delay-700">
              {[
                { label: 'Active Students', value: '10K+' },
                { label: 'Courses', value: '50+' },
                { label: 'cNFTs Minted', value: '25K+' },
                { label: 'XP Earned', value: '2M+' },
              ].map((stat, i) => (
                <div key={i} className="space-y-1">
                  <div className="text-3xl font-black gradient-text">{stat.value}</div>
                  <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Courses Section */}
      <section className="container py-24">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="space-y-4">
            <h2 className="text-3xl font-black tracking-tight sm:text-4xl uppercase">{t('featuredCourses')}</h2>
            <p className="text-muted-foreground text-base max-w-xl">{t('enrollDescription')}</p>
          </div>
          <Button variant="ghost" asChild className="group text-lg font-bold hover:bg-transparent">
            <Link href="/courses" className="flex items-center gap-2">
              {t('exploreAll')}
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {topCourses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      </section>

      {/* Features - Value Props */}
      <section className="container py-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: <Shield className="h-8 w-8" />,
              title: 'On-chain Credentials',
              description: 'Earn compressed NFTs (cNFTs) for every course. Build a verifiable proof-of-skill resume on Solana.',
              color: 'primary'
            },
            {
              icon: <Trophy className="h-8 w-8" />,
              title: 'Gamified Growth',
              description: 'Level up, maintain daily streaks, and climb the global leaderboard. Learning is a competitive sport.',
              color: 'primary'
            },
            {
              icon: <Code className="h-8 w-8" />,
              title: 'Interactive IDE',
              description: 'Write, compile, and deploy Solana programs directly in your browser. Real hands-on experience.',
              color: 'primary'
            }
          ].map((feature, i) => (
            <div key={i} className="group relative p-1 rounded-[2rem] overflow-hidden transition-all hover:scale-[1.02]">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative h-full flex flex-col items-start space-y-5 p-8 rounded-[1.9rem] border border-white/5 bg-card/30 backdrop-blur-xl">
                <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform shadow-inner">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-black">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed font-medium text-sm">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Recommended Learning Paths */}
      <section className="container py-24">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl font-black tracking-tight sm:text-5xl uppercase">Choose Your Learning Path</h2>
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto">
            Curated learning paths to guide you from beginner to expert in Solana development.
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="group p-6 rounded-2xl border bg-card/30 border-white/5 hover:border-white/10 hover:bg-card/50 transition-all">
            <div className="mb-4 inline-flex p-2.5 rounded-xl bg-background border border-border">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <h3 className="text-lg font-bold mb-2 leading-tight">Solana Fundamentals</h3>
            <p className="text-muted-foreground text-sm leading-relaxed mb-6 line-clamp-2">
              Start from scratch and understand the Solana blockchain inside out.
            </p>
            <Button variant="ghost" asChild className="rounded-xl">
              <Link href="/courses?category=development">Explore</Link>
            </Button>
          </div>
          <div className="group p-6 rounded-2xl border bg-card/30 border-white/5 hover:border-white/10 hover:bg-card/50 transition-all">
            <div className="mb-4 inline-flex p-2.5 rounded-xl bg-background border border-border">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <h3 className="text-lg font-bold mb-2 leading-tight">DeFi Developer</h3>
            <p className="text-muted-foreground text-sm leading-relaxed mb-6 line-clamp-2">
              Master DeFi protocols and build decentralized finance applications.
            </p>
            <Button variant="ghost" asChild className="rounded-xl">
              <Link href="/courses?category=defi">Explore</Link>
            </Button>
          </div>
          <div className="group p-6 rounded-2xl border bg-card/30 border-white/5 hover:border-white/10 hover:bg-card/50 transition-all">
            <div className="mb-4 inline-flex p-2.5 rounded-xl bg-background border border-border">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <h3 className="text-lg font-bold mb-2 leading-tight">Security Auditor</h3>
            <p className="text-muted-foreground text-sm leading-relaxed mb-6 line-clamp-2">
              Find bugs, write audits, protect Solana protocols.
            </p>
            <Button variant="ghost" asChild className="rounded-xl">
              <Link href="/courses?category=security">Explore</Link>
            </Button>
          </div>
        </div>
      </section>
      
      {/* Why Superteam Academy? Section */}
      <section className="container py-32 border-t border-white/5">
        <div className="text-center space-y-4 mb-20">
          <h2 className="text-3xl font-black tracking-tight sm:text-5xl uppercase">WHY SUPERTEAM ACADEMY?</h2>
          <p className="text-muted-foreground text-base max-w-2xl mx-auto font-medium">
            Everything you need to become a world-class Solana developer.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            {
              title: 'Interactive Code',
              description: 'Code challenges with integrated editor, real-time feedback and automated tests.',
              icon: <Code className="h-10 w-10 text-primary" />
            },
            {
              title: 'On-Chain Credentials',
              description: 'Certificates as verifiable cNFTs on Solana — prove your skills on-chain.',
              icon: <Shield className="h-10 w-10 text-primary" />
            },
            {
              title: 'Gamified Learning',
              description: 'Earn XP, keep streaks, climb rankings and unlock achievements.',
              icon: <Trophy className="h-10 w-10 text-primary" />
            },
            {
              title: 'Multi-Language',
              description: 'Learn in English, Portuguese or Spanish. More languages coming soon.',
              icon: <Globe className="h-10 w-10 text-primary" />
            }
          ].map((item, i) => (
            <div key={i} className="space-y-6 group">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 w-fit group-hover:bg-primary/10 group-hover:border-primary/30 transition-all">
                {item.icon}
              </div>
              <h3 className="text-2xl font-black tracking-tight">{item.title}</h3>
              <p className="text-muted-foreground leading-relaxed font-medium">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container py-24">
        <div className="relative rounded-[2rem] overflow-hidden border border-white/10 bg-gradient-to-b from-teal-900/30 to-slate-900/30 p-10 md:p-16">
          <div className="absolute right-10 top-1/2 -translate-y-1/2 h-28 w-28 rounded-full ring-1 ring-white/15" />
          <div className="relative z-10 text-center space-y-6">
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              Ready to start your journey?
            </h2>
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
              Join the Superteam Brazil community and become a top-tier Solana developer.
            </p>
            <div className="flex justify-center">
              <Button asChild className="h-11 px-6 rounded-full bg-white text-black hover:bg-white/90">
                <Link href="/auth/sign-up">Create Free Account</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer rendered by layout */}
    </div>
  );
}

