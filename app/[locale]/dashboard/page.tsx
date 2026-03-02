import { Link, redirect } from '@/i18n/routing';
import { createClient } from '@/lib/supabase/server';
import { userService } from '@/lib/services/user.service';
import { courseService } from '@/lib/services/course.service';
import { Button } from '@/components/ui/button';
import { ProgressBar } from '@/components/ui/progress-bar';
import { OnChainStats } from '@/components/dashboard/on-chain-stats';
import { DailyCheckIn } from '@/components/dashboard/daily-check-in';
import { ActivityCalendar } from '@/components/dashboard/activity-calendar';
import {
  ArrowRight,
  Flame,
  Lock,
  Star,
  Trophy,
  BookOpen,
  Medal,
  ShieldCheck,
  Zap
} from 'lucide-react';

type HeatCell = {
  date: string;
  count: number;
};

function levelRange(level: number) {
  const safe = Math.max(1, level || 1);
  const min = safe <= 1 ? 0 : safe * safe * 100;
  const max = (safe + 1) * (safe + 1) * 100;
  return { min, max };
}

export default async function DashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect({ href: '/auth/login', locale });
    return null;
  }

  const userId = user.id;
  const [profile, progress, enrollments, achievements, rank, allCourses] = await Promise.all([
    userService.getProfile(userId),
    userService.getUserProgress(userId),
    courseService.getUserEnrollments(userId),
    userService.getAchievementsWithStatus(userId),
    userService.getUserRank(userId),
    courseService.getCourses()
  ]);
  const unlockedCount = (achievements || []).filter((achievement: any) => achievement.unlocked).length;

  const days = 365;
  const start = new Date();
  start.setDate(start.getDate() - (days - 1));
  const startIso = start.toISOString();

  const { data: completionRows } = await supabase
    .from('lesson_completions')
    .select('completed_at')
    .eq('user_id', userId)
    .gte('completed_at', startIso);

  const byDay = new Map<string, number>();
  (completionRows || []).forEach((row: any) => {
    const d = new Date(row.completed_at).toISOString().slice(0, 10);
    byDay.set(d, (byDay.get(d) || 0) + 1);
  });

  // Count daily activity if user checked in today but completed no lesson.
  const lastActivityDay = progress?.last_activity_date
    ? new Date(progress.last_activity_date).toISOString().slice(0, 10)
    : null;
  const todayKey = new Date().toISOString().slice(0, 10);
  const checkedInToday = lastActivityDay === todayKey;
  if (lastActivityDay && !byDay.has(lastActivityDay)) {
    byDay.set(lastActivityDay, 1);
  }

  const heatCells: HeatCell[] = Array.from({ length: days }).map((_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    return { date: key, count: byDay.get(key) || 0 };
  });
  const activityRecords = heatCells.filter((cell) => cell.count > 0);

  const activeEnrollments = enrollments.filter((e: any) => (e.progress_percentage || 0) < 100);
  const activeEnrollmentIds = activeEnrollments.map((e: any) => e.id);
  const activeXpByEnrollment = new Map<string, number>();
  if (activeEnrollmentIds.length > 0) {
    const { data: xpRows } = await supabase
      .from('lesson_completions')
      .select('enrollment_id, xp_earned')
      .eq('user_id', userId)
      .in('enrollment_id', activeEnrollmentIds);

    (xpRows || []).forEach((row: any) => {
      const current = activeXpByEnrollment.get(row.enrollment_id) || 0;
      activeXpByEnrollment.set(row.enrollment_id, current + Number(row.xp_earned || 0));
    });
  }
  const enrolledCourseIds = new Set(enrollments.map((e: any) => e.course_id || e.courses?.id));
  const recommendedCourses = allCourses.filter((c) => !enrolledCourseIds.has(c.id)).slice(0, 2);

  const xp = progress?.total_xp || 0;
  const level = progress?.level || 1;
  const streak = progress?.current_streak || 0;
  const { min, max } = levelRange(level);
  const levelProgress = Math.max(0, Math.min(100, Math.round(((xp - min) / Math.max(1, max - min)) * 100)));

  const categoryProgress = new Map<string, { total: number; count: number }>();
  activeEnrollments.forEach((enrollment: any) => {
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
    { label: 'NFTs', category: 'nfts', color: 'from-pink-500 to-purple-500' },
    { label: 'DeFi', category: 'defi', color: 'from-amber-500 to-orange-500' }
  ].map((skill) => {
    const bucket = categoryProgress.get(skill.category);
    const avg = bucket ? bucket.total / Math.max(1, bucket.count) : 0;
    const level = Math.min(5, Math.round(avg / 20));
    return { ...skill, level, progress: Math.min(100, Math.round(avg)) };
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="container space-y-8 py-12">
        <section className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 md:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Quest Dashboard</p>
              <h1 className="text-4xl font-black tracking-tight md:text-5xl">
                {profile?.username || user.email?.split('@')[0] || 'Learner'}
              </h1>
              <p className="text-sm text-muted-foreground">
                Joined {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'recently'} · {xp.toLocaleString()} XP · {streak} day streak
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <DailyCheckIn alreadyCheckedIn={checkedInToday} />
              <OnChainStats />
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Total XP', value: xp.toLocaleString(), icon: Zap, tone: 'text-amber-400' },
            { label: 'Level', value: String(level), icon: Star, tone: 'text-violet-400' },
            { label: 'Streak', value: String(streak), icon: Flame, tone: 'text-orange-400' },
            { label: 'Rank', value: rank ? `#${rank}` : '-', icon: Trophy, tone: 'text-primary' }
          ].map((card) => (
            <div key={card.label} className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
              <p className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                <card.icon className={`h-3.5 w-3.5 ${card.tone}`} />
                {card.label}
              </p>
              <p className="text-4xl font-black tracking-tight">{card.value}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-xl font-black">Level {level} Progress</p>
                <p className="text-sm text-muted-foreground">{xp.toLocaleString()} / {max.toLocaleString()} XP</p>
              </div>
              <ProgressBar progress={levelProgress} showLabel={false} className="h-3 rounded-full bg-white/10" />
              <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                <span>Current</span>
                <span>{levelProgress}% to Level {level + 1}</span>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
              <div className="mb-5 flex items-center justify-between">
                <p className="text-xl font-black">Active Quests</p>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/my-courses">
                      View All
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/courses">
                      Browse
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
              <div className="space-y-4">
                {activeEnrollments.length > 0 ? activeEnrollments.slice(0, 3).map((enrollment: any) => (
                  <Link
                    key={enrollment.id}
                    href={(enrollment.courses?.slug ? `/courses/${enrollment.courses.slug}` : '/courses') as any}
                    className="block rounded-xl border border-white/10 bg-black/20 p-4 transition hover:border-primary/40 hover:bg-black/30"
                  >
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <p className="line-clamp-1 text-base font-bold">{enrollment.courses?.title}</p>
                      <span className="text-sm text-muted-foreground">{enrollment.progress_percentage || 0}%</span>
                    </div>
                    <ProgressBar progress={enrollment.progress_percentage || 0} showLabel={false} className="h-2.5 rounded-full bg-white/10" />
                    <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                      <span>{enrollment.courses?.difficulty || 'beginner'}</span>
                      <span>{(activeXpByEnrollment.get(enrollment.id) || 0).toLocaleString()} XP earned</span>
                    </div>
                  </Link>
                )) : (
                  <div className="rounded-xl border border-dashed border-white/10 p-6 text-sm text-muted-foreground">
                    No active quests yet. Enroll in a course to start tracking progress.
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
              <p className="mb-5 text-xl font-black">Recommended Quests</p>
              <div className="grid gap-4 md:grid-cols-2">
                {recommendedCourses.map((course) => (
                  <Link key={course.id} href={`/courses/${course.slug}` as any} className="rounded-xl border border-white/10 bg-black/20 p-4 transition hover:border-primary/40 hover:bg-black/30">
                    <p className="line-clamp-1 font-bold">{course.title}</p>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{course.description}</p>
                    <p className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" /> {Math.round((course.duration_minutes || 0) / 60)}h</span>
                      <span className="inline-flex items-center gap-1"><Medal className="h-3.5 w-3.5 text-primary" /> {course.xp_reward || 0} XP</span>
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <ActivityCalendar
              records={activityRecords}
              streak={streak}
              checkedInToday={checkedInToday}
              lastActivityDay={lastActivityDay}
            />

            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-xl font-black">Achievements</p>
                <Link href="/profile" className="text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-primary">
                  View all
                </Link>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {(achievements || []).slice(0, 4).map((achievement: any) => {
                  const tileLocked = !achievement.unlocked;
                  return (
                    <div
                      key={achievement.id}
                      className={`flex h-16 items-center justify-center rounded-xl border border-white/10 text-2xl ${
                        tileLocked ? 'bg-black/10 opacity-60' : 'bg-black/25'
                      }`}
                    >
                      {achievement.icon || 'T'}
                    </div>
                  );
                })}
                {(achievements || []).length === 0 && Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={`achievement-placeholder-${index}`}
                    className="flex h-16 items-center justify-center rounded-xl border border-white/10 bg-black/10 text-base font-bold opacity-60"
                  >
                    LOCK
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                {unlockedCount} achievements unlocked
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
              <p className="mb-4 text-xl font-black">Skills</p>
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
              <p className="mt-4 inline-flex items-center gap-1 text-xs text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                Derived from your enrolled-course progress
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
