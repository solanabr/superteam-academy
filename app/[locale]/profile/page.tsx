import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { userService } from '@/lib/services/user.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { XPBadge } from '@/components/gamification/xp-badge';
import { Flame, Calendar, Trophy, User, Mail, Shield, Award } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import Image from 'next/image';

export default async function ProfilePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  const [profile, progress, achievements, t] = await Promise.all([
    userService.getProfile(user.id),
    userService.getUserProgress(user.id),
    userService.getUserAchievements(user.id),
    getTranslations('Profile')
  ]);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Profile Header Background */}
      <div className="h-48 md:h-64 bg-gradient-to-r from-primary/20 via-background to-secondary/20 border-b border-border/50 relative">
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:32px_32px]" />
      </div>

      <div className="container -mt-24 pb-12 relative z-10">
        <div className="grid gap-8 lg:grid-cols-12">
          {/* Left Column: Profile Card */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
              <CardContent className="pt-8 text-center space-y-6">
                <div className="relative mx-auto w-32 h-32">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-primary to-secondary animate-pulse opacity-50 blur-lg" />
                  <div className="relative flex h-32 w-32 items-center justify-center rounded-full bg-card border-4 border-background text-4xl font-bold text-primary shadow-xl overflow-hidden">
                    {profile?.avatar_url ? (
                      <Image 
                        src={profile.avatar_url} 
                        alt={profile.username || 'User'} 
                        fill
                        className="object-cover"
                      />
                    ) : (
                      profile?.username?.charAt(0).toUpperCase() || 'U'
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <h2 className="text-3xl font-extrabold tracking-tight gradient-text">
                    {profile?.username || 'Anonymous'}
                  </h2>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <XPBadge 
                      xp={progress?.total_xp || 0} 
                      level={progress?.level || 1} 
                      showLevel 
                    />
                    {/* {(profile as any)?.role === 'admin' && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                        <Shield className="w-3 h-3 mr-1" />
                        Admin
                      </span>
                    )} */}
                  </div>
                </div>

                {profile?.bio && (
                  <p className="text-sm text-muted-foreground leading-relaxed px-4">
                    {profile.bio}
                  </p>
                )}

                <div className="pt-6 border-t border-border/50 space-y-4">
                  <div className="flex items-center justify-between text-sm px-4">
                    <span className="text-muted-foreground flex items-center">
                      <Mail className="w-4 h-4 mr-2" />
                      Email
                    </span>
                    <span className="font-medium">{profile?.email || 'Not provided'}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm px-4">
                    <span className="text-muted-foreground flex items-center">
                      <Calendar className="w-4 h-4 mr-2" />
                      {t('memberSince')}
                    </span>
                    <span className="font-medium">
                      {profile?.created_at 
                        ? new Date(profile.created_at).toLocaleDateString(undefined, {
                            month: 'long',
                            year: 'numeric'
                          })
                        : 'Recently'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Award className="w-5 h-5 mr-2 text-primary" />
                  {t('stats')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 rounded-xl bg-orange-500/5 border border-orange-500/10">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-orange-500/10">
                      <Flame className="h-5 w-5 text-orange-500" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-orange-500/70 uppercase tracking-wider">{t('currentStreak')}</p>
                      <p className="text-2xl font-bold text-orange-500">{t('days', { count: progress?.current_streak || 0 })}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-yellow-500/5 border border-yellow-500/10">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-yellow-500/10">
                      <Trophy className="h-5 w-5 text-yellow-500" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-yellow-500/70 uppercase tracking-wider">{t('longestStreak')}</p>
                      <p className="text-2xl font-bold text-yellow-500">{t('days', { count: progress?.longest_streak || 0 })}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Achievements & Activity */}
          <div className="lg:col-span-8 space-y-8">
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm h-full">
              <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 pb-6">
                <div>
                  <CardTitle className="text-2xl font-bold">{t('achievements')}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t('unlocked', { count: achievements.length })}
                  </p>
                </div>
                <div className="p-2 rounded-full bg-primary/10">
                  <Award className="h-6 w-6 text-primary" />
                </div>
              </CardHeader>
              <CardContent className="pt-8">
                {achievements.length > 0 ? (
                  <div className="grid gap-6 sm:grid-cols-2">
                    {achievements.map((achievement: any) => (
                      <div
                        key={achievement.id}
                        className="group flex items-start gap-4 rounded-2xl border border-border/50 bg-card/30 p-5 hover:border-primary/50 hover:bg-primary/5 transition-all duration-300"
                      >
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 text-4xl shadow-inner group-hover:scale-110 transition-transform duration-300">
                          {achievement.icon}
                        </div>
                        <div className="flex-1 space-y-1">
                          <p className="font-bold text-lg">{achievement.title}</p>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {achievement.description}
                          </p>
                          <div className="pt-2 flex items-center text-[10px] font-bold uppercase tracking-tighter text-muted-foreground/60">
                            <Calendar className="w-3 h-3 mr-1" />
                            {t('earnedAt', { date: new Date(achievement.earned_at).toLocaleDateString() })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-24 border-2 border-dashed border-border/50 rounded-3xl">
                    <div className="relative mx-auto w-24 h-24 mb-6">
                      <div className="absolute inset-0 bg-primary/10 rounded-full animate-ping opacity-20" />
                      <div className="relative flex items-center justify-center w-24 h-24 bg-primary/5 rounded-full border border-primary/20">
                        <Trophy className="h-12 w-12 text-muted-foreground/40" />
                      </div>
                    </div>
                    <h3 className="text-xl font-bold mb-2">{t('noAchievements')}</h3>
                    <p className="text-muted-foreground max-w-xs mx-auto">
                      {t('startEarning')}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

