import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { userService } from '@/lib/services/user.service';
import { courseService } from '@/lib/services/course.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XPBadge } from '@/components/gamification/xp-badge';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Trophy, Flame, BookOpen, ArrowRight } from 'lucide-react';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  const [profile, progress, enrollments, achievements] = await Promise.all([
    userService.getProfile(user.id),
    userService.getUserProgress(user.id),
    courseService.getUserEnrollments(user.id),
    userService.getUserAchievements(user.id)
  ]);

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back, {profile?.display_name || 'Learner'}
        </h1>
        <p className="text-muted-foreground">Continue your learning journey</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total XP</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{progress?.total_xp || 0}</div>
            <p className="text-xs text-muted-foreground">Level {progress?.level || 1}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
            <Flame className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{progress?.current_streak || 0}</div>
            <p className="text-xs text-muted-foreground">days in a row</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Enrolled Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{enrollments.length}</div>
            <p className="text-xs text-muted-foreground">active courses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Achievements</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{achievements.length}</div>
            <p className="text-xs text-muted-foreground">unlocked</p>
          </CardContent>
        </Card>
      </div>

      {/* My Courses */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>My Courses</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/courses">Browse More</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {enrollments.length > 0 ? (
            <div className="space-y-4">
              {enrollments.map((enrollment: any) => (
                <div
                  key={enrollment.id}
                  className="flex items-center gap-4 rounded-lg border border-border p-4"
                >
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">{enrollment.courses?.title}</h3>
                      <span className="text-sm text-muted-foreground">
                        {enrollment.progress_percentage}%
                      </span>
                    </div>
                    <ProgressBar progress={enrollment.progress_percentage} showLabel={false} />
                  </div>
                  <Button size="sm" asChild>
                    <Link href={`/courses/${enrollment.courses?.slug}`}>
                      Continue
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <BookOpen className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-muted-foreground">No enrolled courses yet</p>
              <Button className="mt-4" asChild>
                <Link href="/courses">Browse Courses</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Achievements */}
      {achievements.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Achievements</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/profile">View All</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {achievements.slice(0, 3).map((achievement: any) => (
                <div
                  key={achievement.id}
                  className="flex items-center gap-3 rounded-lg border border-border p-4"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-2xl">
                    {achievement.icon}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{achievement.title}</p>
                    <p className="text-xs text-muted-foreground">{achievement.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
