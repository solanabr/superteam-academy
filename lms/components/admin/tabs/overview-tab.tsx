"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Calendar,
  BookOpen,
  Users,
  Coins,
  RefreshCw,
  Rocket,
  Database,
} from "lucide-react";
import { toast } from "sonner";
import { fetchStats, runSetup, seedCourses } from "@/lib/admin/api";
import { TxResult } from "../shared/tx-result";
import { shortenAddress } from "@/lib/utils";

export function OverviewTab({ adminSecret }: { adminSecret: string }) {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: () => fetchStats(adminSecret),
  });

  const setupMutation = useMutation({
    mutationFn: () => runSetup(adminSecret),
    onSuccess: (res) => {
      toast.success("Setup completed", {
        description: res.results?.join(", "),
      });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const seedMutation = useMutation({
    mutationFn: () => seedCourses(adminSecret),
    onSuccess: (res) => {
      toast.success(`Seeded ${res.count} courses to DB`, {
        description: res.results?.join(", "),
      });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    );
  }

  const config = data?.config;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Season</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {config?.currentSeason ?? "—"}
            </div>
            <Badge
              variant={config?.seasonClosed ? "destructive" : "default"}
              className="mt-1"
            >
              {config?.seasonClosed ? "Closed" : "Active"}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data?.courses.length ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {data?.courses.filter((c) => c.isActive).length ?? 0} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Learners</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.learnerCount ?? 0}</div>
            <p className="text-xs text-muted-foreground">total registered</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">XP Mint</CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="truncate font-mono text-sm">
              {config?.xpMint ? shortenAddress(config.xpMint, 6) : "—"}
            </div>
            <p className="text-xs text-muted-foreground">
              Max daily: {config?.maxDailyXp ?? "—"}
            </p>
          </CardContent>
        </Card>
      </div>

      {config && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Config Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">Authority</dt>
                <dd className="font-mono">
                  {config.authority ? shortenAddress(config.authority, 6) : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Backend Signer</dt>
                <dd className="font-mono">
                  {config.backendSigner
                    ? shortenAddress(config.backendSigner, 6)
                    : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Max Daily XP</dt>
                <dd>{config.maxDailyXp}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Max Achievement XP</dt>
                <dd>{config.maxAchievementXp}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Total Courses Created</dt>
                <dd>{config.totalCoursesCreated}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      )}

      {data?.learners && data.learners.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Registered Learners
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.learners.map((l) => (
                <div
                  key={l.wallet}
                  className="flex items-center justify-between rounded-md border p-3"
                >
                  <div>
                    <span className="font-mono text-sm">
                      {shortenAddress(l.wallet, 6)}
                    </span>
                    {l.displayName && (
                      <span className="ml-2 text-sm text-muted-foreground">
                        ({l.displayName})
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Badge variant="outline">{l.xp} XP</Badge>
                    <span className="text-muted-foreground">
                      {l.streak}d streak
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {data?.enrollments && data.enrollments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Enrollments ({data.enrollments.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.enrollments.map((e, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-md border p-3"
                >
                  <div>
                    <span className="font-medium text-sm">{e.courseId}</span>
                    <span className="ml-2 font-mono text-xs text-muted-foreground">
                      {shortenAddress(e.userId, 4)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span>
                      {e.lessonsCompleted}/{e.totalLessons} lessons
                    </span>
                    <Badge variant={e.completedAt ? "default" : "secondary"}>
                      {e.completedAt ? "Completed" : `${e.percentComplete}%`}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center gap-4">
        <Button
          onClick={() => setupMutation.mutate()}
          disabled={setupMutation.isPending}
        >
          <Rocket className="mr-2 h-4 w-4" />
          {setupMutation.isPending ? "Running Setup..." : "Run Setup"}
        </Button>
        <Button
          variant="secondary"
          onClick={() => seedMutation.mutate()}
          disabled={seedMutation.isPending}
        >
          <Database className="mr-2 h-4 w-4" />
          {seedMutation.isPending ? "Seeding..." : "Seed Courses to DB"}
        </Button>
        <Button
          variant="outline"
          onClick={() =>
            queryClient.invalidateQueries({ queryKey: ["admin-stats"] })
          }
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {setupMutation.data?.results && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Setup Results</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1 font-mono text-xs">
              {setupMutation.data.results.map((r: string, i: number) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {seedMutation.data?.results && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Seed Results</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1 font-mono text-xs">
              {seedMutation.data.results.map((r: string, i: number) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
