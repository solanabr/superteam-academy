"use client";

import { useEffect, useState } from "react";
import {
  Users,
  BookOpen,
  Zap,
  Activity,
  Flame,
  TrendingUp,
} from "lucide-react";
import {
  Bar,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Pie,
  PieChart,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

type Analytics = {
  totalLearners: number;
  totalCourses: number;
  totalXp: number;
  activeToday: number;
  avgStreak: number;
  xpBuckets: { label: string; count: number }[];
  streakBuckets: { label: string; count: number }[];
  difficultyDist: { Beginner: number; Intermediate: number; Advanced: number };
  levelDist: { level: number; count: number }[];
};

const xpChartConfig: ChartConfig = {
  count: { label: "Learners", color: "hsl(var(--primary))" },
};
const streakChartConfig: ChartConfig = {
  count: { label: "Learners", color: "hsl(var(--chart-2))" },
};
const levelChartConfig: ChartConfig = {
  count: { label: "Learners", color: "hsl(var(--chart-3))" },
};
const difficultyChartConfig: ChartConfig = {
  Beginner: { label: "Beginner", color: "hsl(var(--chart-1))" },
  Intermediate: { label: "Intermediate", color: "hsl(var(--chart-2))" },
  Advanced: { label: "Advanced", color: "hsl(var(--chart-3))" },
};

const PIE_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
];

export default function AdminDashboard() {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/analytics")
      .then((r) => r.json())
      .then((d: Analytics) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-16 animate-pulse rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const difficultyData = Object.entries(data.difficultyDist).map(
    ([name, value]) => ({ name, value }),
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* Overview cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          title="Total Learners"
          value={data.totalLearners}
          icon={Users}
        />
        <StatCard
          title="Total Courses"
          value={data.totalCourses}
          icon={BookOpen}
        />
        <StatCard
          title="Total XP Awarded"
          value={data.totalXp.toLocaleString()}
          icon={Zap}
        />
        <StatCard
          title="Active Today"
          value={data.activeToday}
          icon={Activity}
        />
        <StatCard
          title="Avg Streak"
          value={`${data.avgStreak} days`}
          icon={Flame}
        />
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* XP Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4" />
              XP Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={xpChartConfig} className="h-[250px] w-full">
              <BarChart data={data.xpBuckets}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" fontSize={12} tickLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar
                  dataKey="count"
                  fill="var(--color-count)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Streak Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Flame className="h-4 w-4" />
              Streak Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={streakChartConfig}
              className="h-[250px] w-full"
            >
              <BarChart data={data.streakBuckets}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" fontSize={12} tickLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar
                  dataKey="count"
                  fill="var(--color-count)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Level Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4" />
              Level Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={levelChartConfig}
              className="h-[250px] w-full"
            >
              <BarChart data={data.levelDist}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="level"
                  fontSize={12}
                  tickLine={false}
                  tickFormatter={(v: number) => `Lvl ${v}`}
                />
                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar
                  dataKey="count"
                  fill="var(--color-count)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Difficulty Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BookOpen className="h-4 w-4" />
              Course Difficulty
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            <ChartContainer
              config={difficultyChartConfig}
              className="h-[250px] w-full"
            >
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent />} />
                <Pie
                  data={difficultyData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={90}
                  paddingAngle={4}
                >
                  {difficultyData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
}: {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs text-muted-foreground">{title}</p>
            <p className="text-lg font-bold">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
