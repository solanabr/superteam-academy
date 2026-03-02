import { redirect } from 'next/navigation';
import { Link } from '@/i18n/routing';
import { createClient } from '@/lib/supabase/server';
import { userService } from '@/lib/services/user.service';
import { courseService } from '@/lib/services/course.service';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Flame, Medal, Star, Trophy, Wallet, Zap } from 'lucide-react';
import Image from 'next/image';
import { AchievementMintGrid } from '@/components/profile/achievement-mint-grid';

function levelRange(level: number) {
  const safe = Math.max(1, level || 1);
  const min = safe * safe * 100;
  const max = (safe + 1) * (safe + 1) * 100;
  return { min, max };
}

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  const [profile, progress, achievements, rank, enrollments, certificatesResponse, achievementMintsResponse] = await Promise.all([
    userService.getProfile(user.id),
    userService.getUserProgress(user.id),
    userService.getAchievementsWithStatus(user.id),
    userService.getUserRank(user.id),
    courseService.getUserEnrollments(user.id),
    supabase
      .from('course_certificates')
      .select('id, mint_address, signature, issued_at, courses(title)')
      .eq('user_id', user.id)
      .order('issued_at', { ascending: false }),
    supabase
      .from('user_achievement_certificates')
      .select('achievement_id')
      .eq('user_id', user.id)
  ]);

  const certificates = certificatesResponse.data || [];
  const achievementMintedIds = (achievementMintsResponse.data || []).map((row: any) => row.achievement_id);
  const xp = progress?.total_xp || 0;
  const level = progress?.level || 1;
  const streak = progress?.current_streak || 0;
  const { max } = levelRange(level);
  const levelProgress = Math.max(0, Math.min(100, Math.round((xp / Math.max(1, max)) * 100)));

  const categoryProgress = new Map<string, { total: number; count: number }>();
  enrollments.forEach((enrollment: any) => {
    const category = enrollment.courses?.category || 'other';
    const current = categoryProgress.get(category) || { total: 0, count: 0 };
    categoryProgress.set(category, {
      total: current.total + (enrollment.progress_percentage || 0),
      count: current.count + 1
    });
  });

  const skills = [
    { label: 'Solana Basics', category: 'web3', color: 'from-violet-500 to-fuchsia-500' },
    { label: 'Rust', category: 'solana-development', color: 'from-orange-500 to-rose-500' },
    { label: 'Anchor', category: 'smart-contracts', color: 'from-cyan-500 to-blue-500' },
    { label: 'DeFi', category: 'defi', color: 'from-amber-500 to-orange-500' },
    { label: 'NFTs', category: 'nfts', color: 'from-pink-500 to-purple-500' }
  ].map((skill) => {
    const bucket = categoryProgress.get(skill.category);
    const avg = bucket ? bucket.total / Math.max(1, bucket.count) : 0;
    return { ...skill, level: Math.min(5, Math.round(avg / 20)), progress: Math.min(100, Math.round(avg)) };
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="container space-y-8 py-12">
        <section className="rounded-3xl border border-white/10 bg-white/[0.02]">
          <div className="h-2 rounded-t-3xl bg-gradient-to-r from-violet-500 via-primary to-cyan-400" />
          <div className="flex flex-col gap-6 p-6 md:flex-row md:items-center md:justify-between md:p-8">
            <div className="flex items-center gap-4">
              <div className="relative h-20 w-20 overflow-hidden rounded-full border-2 border-white/15 bg-primary/10">
                {profile?.avatar_url ? (
                  <Image src={profile.avatar_url} alt={profile?.username || 'User'} fill className="object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-3xl font-black text-primary">
                    {(profile?.username || user.email || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <h1 className="text-3xl font-black tracking-tight">{profile?.username || 'Quest Hero'}</h1>
                <p className="text-sm text-muted-foreground">{profile?.bio || 'A brave developer on the path to Solana mastery.'}</p>
                <p className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> Joined {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'recently'}</span>
                  <span className="inline-flex items-center gap-1"><Zap className="h-3.5 w-3.5 text-amber-400" /> {xp.toLocaleString()} XP</span>
                  <span className="inline-flex items-center gap-1"><Flame className="h-3.5 w-3.5 text-orange-400" /> {streak} day streak</span>
                </p>
              </div>
            </div>
            <Button asChild variant="outline" className="rounded-xl border-white/15 bg-white/5 hover:bg-white/10">
              <Link href="/settings">Edit Profile</Link>
            </Button>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Total XP', value: xp.toLocaleString(), icon: Zap, tone: 'text-amber-400' },
            { label: 'Level', value: String(level), icon: Star, tone: 'text-violet-400' },
            { label: 'Streak', value: `${streak}`, icon: Flame, tone: 'text-orange-400' },
            { label: 'Rank', value: rank ? `#${rank}` : '-', icon: Trophy, tone: 'text-primary' }
          ].map((item) => (
            <Card key={item.label} className="rounded-2xl border-white/10 bg-white/[0.02]">
              <CardContent className="p-5">
                <p className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                  <item.icon className={`h-3.5 w-3.5 ${item.tone}`} />
                  {item.label}
                </p>
                <p className="text-4xl font-black tracking-tight">{item.value}</p>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <Card className="rounded-2xl border-white/10 bg-white/[0.02]">
            <CardContent className="p-6">
              <p className="mb-4 text-xl font-black">Level Progress</p>
              <div className="mb-4 text-center">
                <p className="text-6xl font-black">{level}</p>
                <p className="text-sm text-muted-foreground">Current level</p>
              </div>
              <ProgressBar progress={levelProgress} showLabel={false} className="h-3 rounded-full bg-white/10" />
              <p className="mt-3 text-center text-sm text-muted-foreground">{levelProgress}% to Level {level + 1}</p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-white/10 bg-white/[0.02]">
            <CardContent className="p-6">
              <p className="mb-4 text-xl font-black">Skill Tree</p>
              <div className="space-y-3">
                {skills.map((skill) => (
                  <div key={skill.label}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <p>{skill.label}</p>
                      <p className="text-muted-foreground">Lv.{skill.level}/5</p>
                    </div>
                    <div className="h-2 rounded-full bg-white/10">
                      <div className={`h-2 rounded-full bg-gradient-to-r ${skill.color}`} style={{ width: `${skill.progress}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <Card className="rounded-2xl border-white/10 bg-white/[0.02] lg:col-span-2">
            <CardContent className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-xl font-black">Quest Progress</p>
                <Link href="/courses" className="text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-primary">
                  Browse All
                </Link>
              </div>
              <div className="space-y-4">
                {enrollments.length > 0 ? enrollments.slice(0, 4).map((enrollment: any) => (
                  <div key={enrollment.id} className="rounded-xl border border-white/10 bg-black/20 p-4">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <p className="line-clamp-1 font-bold">{enrollment.courses?.title}</p>
                      <span className="text-xs text-muted-foreground">{enrollment.progress_percentage || 0}%</span>
                    </div>
                    <ProgressBar progress={enrollment.progress_percentage || 0} showLabel={false} className="h-2.5 rounded-full bg-white/10" />
                    <p className="mt-2 text-xs text-muted-foreground">
                      {(enrollment.courses?.xp_reward || 0).toLocaleString()} XP reward
                    </p>
                  </div>
                )) : (
                  <p className="text-sm text-muted-foreground">No enrolled courses yet.</p>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <AchievementMintGrid achievements={achievements as any} initialMintedIds={achievementMintedIds} />

            <Card className="rounded-2xl border-white/10 bg-white/[0.02]">
              <CardContent className="p-6">
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-xl font-black">Credentials</p>
                  <Wallet className="h-4 w-4 text-primary" />
                </div>
                <div className="space-y-3">
                  {certificates.length > 0 ? certificates.slice(0, 3).map((cert: any) => (
                    <div key={cert.id} className="rounded-xl border border-white/10 bg-black/20 p-3">
                      <p className="line-clamp-1 text-sm font-semibold">{cert.courses?.title || 'Course Certificate'}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Mint: {cert.mint_address.slice(0, 6)}...{cert.mint_address.slice(-6)}
                      </p>
                    </div>
                  )) : (
                    <p className="text-sm text-muted-foreground">Complete a course to mint your first credential.</p>
                  )}
                </div>
                {certificates.length > 0 && (
                  <Link href="/certificates" className="mt-4 inline-flex items-center gap-1 text-xs font-bold uppercase tracking-widest text-primary">
                    View all certificates
                    <Medal className="h-3.5 w-3.5" />
                  </Link>
                )}
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </div>
  );
}
