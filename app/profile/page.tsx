import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { userService } from '@/lib/services/user.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { XPBadge } from '@/components/gamification/xp-badge';
import { Flame, Calendar, Trophy } from 'lucide-react';

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  const [profile, progress, achievements] = await Promise.all([
    userService.getProfile(user.id),
    userService.getUserProgress(user.id),
    userService.getUserAchievements(user.id)
  ]);

  return (
    <div className="container py-8">
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Profile Info */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 text-3xl font-bold text-primary">
                  {profile?.display_name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{profile?.display_name || 'Anonymous'}</h2>
                  {profile?.username && (
                    <p className="text-sm text-muted-foreground">@{profile.username}</p>
                  )}
                </div>
                {profile?.bio && (
                  <p className="text-sm text-muted-foreground">{profile.bio}</p>
                )}
                <XPBadge 
                  xp={progress?.total_xp || 0} 
                  level={progress?.level || 1} 
                  showLevel 
                  className="justify-center"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Flame className="h-5 w-5 text-orange-500" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Current Streak</p>
                  <p className="text-2xl font-bold">{progress?.current_streak || 0} days</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Trophy className="h-5 w-5 text-yellow-500" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Longest Streak</p>
                  <p className="text-2xl font-bold">{progress?.longest_streak || 0} days</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-primary" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Member Since</p>
                  <p className="text-sm text-muted-foreground">
                    {profile?.created_at 
                      ? new Date(profile.created_at).toLocaleDateString('en-US', {
                          month: 'long',
                          year: 'numeric'
                        })
                      : 'Recently'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Achievements */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Achievements</CardTitle>
              <p className="text-sm text-muted-foreground">
                {achievements.length} unlocked
              </p>
            </CardHeader>
            <CardContent>
              {achievements.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {achievements.map((achievement: any) => (
                    <div
                      key={achievement.id}
                      className="flex items-start gap-4 rounded-lg border border-border p-4"
                    >
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-3xl">
                        {achievement.icon}
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="font-semibold">{achievement.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {achievement.description}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Earned {new Date(achievement.earned_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Trophy className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-4 text-muted-foreground">No achievements yet</p>
                  <p className="text-sm text-muted-foreground">Complete lessons to start earning achievements</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
