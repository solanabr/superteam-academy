"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Zap, Flame, Trophy, Clock, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type UserProfile = {
  wallet: string;
  level: number;
  xp: number;
  streak: number;
  streakLongest: number;
  lastActivityTs: number;
  address: string;
};

type ActivityDay = { date: string; intensity: number; count: number };
type RecentItem = {
  type: string;
  text: string;
  course: string;
  time: string;
  xp: number;
};

type UserDetail = {
  profile: UserProfile;
  activity: ActivityDay[];
  recentActivity: RecentItem[];
};

function shortWallet(wallet: string) {
  return `${wallet.slice(0, 4)}...${wallet.slice(-4)}`;
}

type PageProps = { params: Promise<{ wallet: string }> };

export default function AdminUserDetailPage({ params }: PageProps) {
  const { wallet } = use(params);
  const router = useRouter();
  const [data, setData] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/admin/users/${wallet}`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then((d: UserDetail) => setData(d))
      .catch(() => router.replace("/admin/users"))
      .finally(() => setLoading(false));
  }, [wallet, router]);

  if (loading || !data) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const { profile, activity, recentActivity } = data;
  const lastActive = profile.lastActivityTs
    ? new Date(profile.lastActivityTs * 1000).toLocaleString()
    : "Never";
  const activeDays = activity.filter((d) => d.count > 0).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/admin/users")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold font-mono">
            {shortWallet(profile.wallet)}
          </h1>
          <p className="text-xs text-muted-foreground">{profile.wallet}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total XP</p>
              <p className="text-lg font-bold">{profile.xp.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Trophy className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Level</p>
              <p className="text-lg font-bold">{profile.level}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10">
              <Flame className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Current Streak</p>
              <p className="text-lg font-bold">
                {profile.streak} days
                <span className="ml-1 text-xs font-normal text-muted-foreground">
                  (best: {profile.streakLongest})
                </span>
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Last Active</p>
              <p className="text-sm font-bold">{lastActive}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity heatmap mini */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Activity (last 90 days)
            <Badge variant="secondary" className="ml-2">
              {activeDays} active days
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-[3px]">
            {activity.map((day) => (
              <div
                key={day.date}
                className="h-3 w-3 rounded-sm"
                title={`${day.date}: ${day.count} activities`}
                style={{
                  backgroundColor:
                    day.count === 0
                      ? "hsl(var(--muted))"
                      : `hsl(var(--primary) / ${Math.min(0.3 + day.intensity * 0.25, 1)})`,
                }}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {recentActivity.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No recent activity.
            </p>
          ) : (
            <div className="space-y-3">
              {recentActivity.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="text-sm font-medium">{item.text}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.course}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    {item.xp > 0 && (
                      <Badge variant="secondary">+{item.xp} XP</Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {item.time}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
