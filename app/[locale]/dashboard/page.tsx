import { Link, redirect } from '@/i18n/routing';
import { createClient } from '@/lib/supabase/server';
import { userService } from '@/lib/services/user.service';
import { courseService } from '@/lib/services/course.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XPBadge } from '@/components/gamification/xp-badge';
import { ProgressBar } from '@/components/ui/progress-bar';
import { OnChainStats } from '@/components/dashboard/on-chain-stats';
import { Trophy, Flame, BookOpen, ArrowRight, Star, Award, TrendingUp } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { cn } from '@/lib/utils';

export default async function DashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect({ href: '/auth/login', locale });
    return null;
  }

  const userId = user.id as string;

  const [profile, progress, enrollments, achievements, t] = await Promise.all([
    userService.getProfile(userId),
    userService.getUserProgress(userId),
    courseService.getUserEnrollments(userId),
    userService.getUserAchievements(userId),
    getTranslations('Dashboard')
  ]);

  const ct = await getTranslations('Course');

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="container py-20 space-y-16">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10">
          <div className="space-y-6 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[10px] font-black tracking-[0.2em] text-primary uppercase">
              <TrendingUp className="h-3.5 w-3.5" />
              Learning Overview
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase leading-[0.9]">
              {t('welcome', { username: profile?.username || 'Learner' }).split(' ')[0]} <span className="gradient-text">{t('welcome', { username: profile?.username || 'Learner' }).split(' ').slice(1).join(' ')}</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground font-medium leading-relaxed">
              {t('continueJourney')} You're doing great, keep up the momentum.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <div className="flex items-center gap-6 p-6 rounded-[2rem] bg-white/[0.03] border border-white/10 backdrop-blur-xl group hover:border-primary/50 transition-colors">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">{t('totalXP')}</span>
                <div className="flex items-center gap-2">
                  <Star className="h-6 w-6 text-primary fill-primary" />
                  <span className="text-4xl font-black text-white">{(progress?.total_xp || 0).toLocaleString()}</span>
                </div>
              </div>
              <div className="h-12 w-px bg-white/10" />
              <div className="flex flex-col items-center">
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Level</span>
                <div className="h-12 w-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center text-xl font-black shadow-[0_0_20px_rgba(20,241,149,0.3)]">
                  {progress?.level || 1}
                </div>
              </div>
            </div>
            <OnChainStats />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Flame, color: 'text-orange-500', label: t('currentStreak'), value: progress?.current_streak || 0, sub: t('daysInARow') },
            { icon: BookOpen, color: 'text-primary', label: t('enrolledCourses'), value: enrollments.length, sub: t('activeCourses') },
            { icon: Trophy, color: 'text-amber-400', label: t('achievements'), value: achievements.length, sub: t('unlocked') },
            { icon: Award, color: 'text-blue-400', label: 'Global Rank', value: '#124', sub: 'Top 5%' },
          ].map((stat, i) => (
            <Card key={i} className="relative overflow-hidden border-white/10 bg-white/[0.02] hover:bg-white/[0.05] transition-colors rounded-[2rem] p-8">
              <div className="absolute top-6 right-6 p-3 rounded-2xl bg-white/5 border border-white/5">
                <stat.icon className={cn("h-6 w-6", stat.color)} />
              </div>
              <div className="space-y-4">
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{stat.label}</span>
                <div>
                  <div className="text-4xl font-black tracking-tight">{stat.value}</div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1 opacity-60">{stat.sub}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* My Courses Section */}
        <div className="space-y-8">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-2xl font-black uppercase tracking-tight flex items-center gap-3">
              <div className="h-8 w-1.5 bg-primary rounded-full" />
              {t('myCourses')}
            </h2>
            <Button variant="ghost" size="sm" asChild className="text-xs font-black uppercase tracking-widest hover:text-primary transition-colors">
              <Link href="/courses">
                {t('browseMore')}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          {enrollments.length > 0 ? (
            <div className="grid gap-6">
              {enrollments.map((enrollment: any) => (
                <Link
                  key={enrollment.id}
                  href={`/courses/${enrollment.courses?.slug}` as any}
                  className="group"
                >
                  <Card className="overflow-hidden border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-primary/50 transition-all duration-300 rounded-[2.5rem]">
                    <CardContent className="p-8">
                      <div className="flex flex-col lg:flex-row lg:items-center gap-10">
                        <div className="flex-1 space-y-6">
                          <div className="space-y-2">
                            <h3 className="text-2xl font-black tracking-tight group-hover:text-primary transition-colors uppercase">
                              {enrollment.courses?.title}
                            </h3>
                            <p className="text-muted-foreground font-medium line-clamp-1">
                              {enrollment.courses?.description}
                            </p>
                          </div>
                          
                          <div className="space-y-3">
                            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                              <span className="text-muted-foreground">Course Completion</span>
                              <span className="text-primary">{enrollment.progress_percentage}%</span>
                            </div>
                            <ProgressBar 
                              progress={enrollment.progress_percentage} 
                              showLabel={false} 
                              className="h-3 rounded-full bg-white/5"
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-6">
                          <div className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-white/5 border border-white/10">
                            <Star className="h-5 w-5 text-primary fill-primary" />
                            <span className="text-sm font-black tracking-widest uppercase">{enrollment.courses?.xp_reward || 500} XP</span>
                          </div>
                          <Button className="h-14 px-8 rounded-2xl font-black uppercase tracking-widest shadow-2xl shadow-primary/20 group-hover:scale-105 transition-transform">
                            {ct('continueCourse')}
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 rounded-[3rem] border-2 border-dashed border-white/10 bg-white/[0.01] text-center">
              <div className="h-24 w-24 rounded-[2rem] bg-white/5 flex items-center justify-center mb-8 border border-white/5">
                <BookOpen className="h-12 w-12 text-muted-foreground/20" />
              </div>
              <h3 className="text-3xl font-black tracking-tight uppercase mb-4">{t('noCourses')}</h3>
              <p className="text-muted-foreground font-medium max-w-sm mb-10 px-6">
                Start your journey today by enrolling in one of our expert-led Solana courses and earn cNFTs.
              </p>
              <Button size="lg" className="h-14 px-10 rounded-2xl font-black uppercase tracking-widest shadow-2xl shadow-primary/20" asChild>
                <Link href="/courses">{t('browseCourses')}</Link>
              </Button>
            </div>
          )}
        </div>

        {/* Recent Achievements */}
        {achievements.length > 0 && (
          <div className="space-y-8">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-2xl font-black uppercase tracking-tight flex items-center gap-3">
                <div className="h-8 w-1.5 bg-amber-400 rounded-full" />
                {t('recentAchievements')}
              </h2>
              <Button variant="ghost" size="sm" asChild className="text-xs font-black uppercase tracking-widest hover:text-amber-400 transition-colors">
                <Link href="/profile">
                  {t('viewAll')}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {achievements.slice(0, 3).map((achievement: any) => (
                <Card key={achievement.id} className="border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-amber-400/30 transition-all rounded-[2.5rem] p-8">
                  <div className="flex items-center gap-6">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-amber-400/10 text-4xl border border-amber-400/20 shadow-inner">
                      {achievement.icon}
                    </div>
                    <div className="space-y-1">
                      <p className="font-black text-xl tracking-tight uppercase">{achievement.title}</p>
                      <p className="text-xs font-medium text-muted-foreground leading-relaxed">
                        {achievement.description}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
