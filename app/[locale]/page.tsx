import { Link } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { CourseCard } from '@/components/course/course-card';
import { ArrowRight, BookOpen, Trophy, Zap, Shield, Globe, Code, TerminalSquare, PlayCircle, CheckCircle2 } from 'lucide-react';
import { courseService } from '@/lib/services/course.service';
import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  await params;
  const featuredCourses = await courseService.getCourses();
  const platformStats = await courseService.getLandingStats();
  const topCourses = featuredCourses.slice(0, 5);
  
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  const t = await getTranslations('Landing');
  const commonT = await getTranslations('Common');
  const formatCompact = (value: number) =>
    new Intl.NumberFormat('en-US', {
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(Math.max(0, value));

  return (
    <div className="flex flex-col min-h-screen animate-page-enter">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-background">
        {/* Advanced Background Effects */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(20,241,149,0.08)_0%,transparent_70%)]" />
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px] hero-orb-float opacity-50" />
          <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-accent/15 rounded-full blur-[150px] hero-orb-float-delayed opacity-50" />
          <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:radial-gradient(ellipse_at_center,white,transparent_75%)] opacity-20" />
        </div>

        <div className="container relative z-10 py-20">
          <div className="mx-auto max-w-5xl text-center space-y-12">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-5 py-2 text-xs sm:text-sm font-bold text-primary backdrop-blur-md animate-in fade-in slide-in-from-bottom-4 duration-1000">
              <Zap className="h-4 w-4 fill-primary animate-pulse" />
              <span className="uppercase tracking-widest">
                {commonT('home')} | {t('heroBadgeSuffix')}
              </span>
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
                { label: t('statsActiveStudents'), value: formatCompact(platformStats.activeStudents) },
                { label: t('statsCourses'), value: formatCompact(platformStats.totalCourses) },
                { label: t('statsCnftsMinted'), value: formatCompact(platformStats.totalCnftsMinted) },
                { label: t('statsXpEarned'), value: formatCompact(platformStats.totalXpEarned) },
              ].map((stat, i) => (
                <div key={i} className="space-y-1 stat-pop" style={{ animationDelay: `${i * 120}ms` }}>
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

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
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
              title: t('featureOnchainTitle'),
              description: t('featureOnchainDescription'),
              color: 'primary'
            },
            {
              icon: <Trophy className="h-8 w-8" />,
              title: t('featureGamifiedTitle'),
              description: t('featureGamifiedDescription'),
              color: 'primary'
            },
            {
              icon: <Code className="h-8 w-8" />,
              title: t('featureIdeTitle'),
              description: t('featureIdeDescription'),
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

      {/* Coding Interface Preview */}
      <section className="container py-24">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div className="space-y-4">
            <p className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-black uppercase tracking-[0.2em] text-primary">
              <TerminalSquare className="h-4 w-4" />
              In-browser IDE
            </p>
            <h2 className="text-3xl font-black tracking-tight sm:text-5xl">{t('featureIdeTitle')}</h2>
            <p className="text-muted-foreground">{t('featureIdeDescription')}</p>
            <div className="grid gap-3 text-sm text-muted-foreground">
              <p className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> Run tests instantly</p>
              <p className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> Track XP per exercise</p>
              <p className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> Save progress lesson-by-lesson</p>
            </div>
            <Button asChild className="rounded-xl font-black uppercase tracking-widest">
              <Link href="/courses">
                Try Coding Lessons
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="rounded-3xl border border-white/10 bg-[#0d1224] p-4 shadow-2xl">
            <div className="mb-3 flex items-center justify-between rounded-2xl bg-white/5 px-4 py-2 text-xs text-white/60">
              <span>lesson.ts</span>
              <span className="inline-flex items-center gap-1"><PlayCircle className="h-3.5 w-3.5 text-primary" /> Run</span>
            </div>
            <div className="rounded-2xl bg-black/30 p-4 font-mono text-sm leading-7 text-white/85">
              <p><span className="text-sky-300">export</span> <span className="text-fuchsia-300">function</span> <span className="text-amber-300">derivePDA</span>() {'{'}</p>
              <p className="pl-4"><span className="text-sky-300">const</span> seed = <span className="text-emerald-300">'user-progress'</span>;</p>
              <p className="pl-4"><span className="text-sky-300">return</span> [seed, walletPublicKey];</p>
              <p>{'}'}</p>
            </div>
            <div className="mt-3 rounded-2xl border border-primary/20 bg-primary/10 px-4 py-3 text-xs text-primary">
              Test result: 3/3 passed, +50 XP awarded.
            </div>
          </div>
        </div>
      </section>

      {/* Recommended Learning Paths */}
      <section className="container py-24">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl font-black tracking-tight sm:text-5xl uppercase">{t('pathsTitle')}</h2>
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto">
            {t('pathsSubtitle')}
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="group p-6 rounded-2xl border bg-card/30 border-white/5 hover:border-white/10 hover:bg-card/50 transition-all">
            <div className="mb-4 inline-flex p-2.5 rounded-xl bg-background border border-border">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <h3 className="text-lg font-bold mb-2 leading-tight">{t('pathFundamentalsTitle')}</h3>
            <p className="text-muted-foreground text-sm leading-relaxed mb-6 line-clamp-2">
              {t('pathFundamentalsDescription')}
            </p>
            <Button variant="ghost" asChild className="rounded-xl">
              <Link href="/courses?category=development">{t('pathExplore')}</Link>
            </Button>
          </div>
          <div className="group p-6 rounded-2xl border bg-card/30 border-white/5 hover:border-white/10 hover:bg-card/50 transition-all">
            <div className="mb-4 inline-flex p-2.5 rounded-xl bg-background border border-border">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <h3 className="text-lg font-bold mb-2 leading-tight">{t('pathDefiTitle')}</h3>
            <p className="text-muted-foreground text-sm leading-relaxed mb-6 line-clamp-2">
              {t('pathDefiDescription')}
            </p>
            <Button variant="ghost" asChild className="rounded-xl">
              <Link href="/courses?category=defi">{t('pathExplore')}</Link>
            </Button>
          </div>
          <div className="group p-6 rounded-2xl border bg-card/30 border-white/5 hover:border-white/10 hover:bg-card/50 transition-all">
            <div className="mb-4 inline-flex p-2.5 rounded-xl bg-background border border-border">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <h3 className="text-lg font-bold mb-2 leading-tight">{t('pathSecurityTitle')}</h3>
            <p className="text-muted-foreground text-sm leading-relaxed mb-6 line-clamp-2">
              {t('pathSecurityDescription')}
            </p>
            <Button variant="ghost" asChild className="rounded-xl">
              <Link href="/courses?category=security">{t('pathExplore')}</Link>
            </Button>
          </div>
        </div>
      </section>
      
      {/* Why Superteam Academy? Section */}
      <section className="container py-32 border-t border-white/5">
        <div className="text-center space-y-4 mb-20">
          <h2 className="text-3xl font-black tracking-tight sm:text-5xl uppercase">{t('whyTitle')}</h2>
          <p className="text-muted-foreground text-base max-w-2xl mx-auto font-medium">
            {t('whySubtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            {
              title: t('whyInteractiveTitle'),
              description: t('whyInteractiveDescription'),
              icon: <Code className="h-10 w-10 text-primary" />
            },
            {
              title: t('whyOnchainTitle'),
              description: t('whyOnchainDescription'),
              icon: <Shield className="h-10 w-10 text-primary" />
            },
            {
              title: t('whyGamifiedTitle'),
              description: t('whyGamifiedDescription'),
              icon: <Trophy className="h-10 w-10 text-primary" />
            },
            {
              title: t('whyMultilanguageTitle'),
              description: t('whyMultilanguageDescription'),
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
              {user ? t('ctaTitleLoggedIn') : t('ctaTitleLoggedOut')}
            </h2>
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
              {user ? t('ctaTextLoggedIn') : t('ctaTextLoggedOut')}
            </p>
            <div className="flex justify-center">
              {user ? (
                <Button asChild className="h-11 px-8 rounded-full bg-primary text-primary-foreground font-bold hover:bg-primary/90 shadow-[0_0_20px_rgba(20,241,149,0.3)]">
                  <Link href="/dashboard">{t('ctaButtonDashboard')}</Link>
                </Button>
              ) : (
                <Button asChild className="h-11 px-8 rounded-full bg-white text-black font-bold hover:bg-white/90">
                  <Link href="/auth/sign-up">{t('ctaButtonCreateAccount')}</Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Footer rendered by layout */}
    </div>
  );
}

