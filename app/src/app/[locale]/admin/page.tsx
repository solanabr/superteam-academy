"use client";

import { useTranslations } from "next-intl";
import {
  BookOpen,
  Users,
  Zap,
  Trophy,
  TrendingUp,
  Activity,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const MOCK_STATS = {
  totalUsers: 523,
  totalCourses: 12,
  totalXpMinted: 1_450_000,
  totalCredentials: 187,
  activeEnrollments: 342,
  weeklyActiveUsers: 156,
};

const MOCK_COURSES = [
  { id: "solana-101", enrollments: 245, completions: 89, xpAwarded: 356000 },
  { id: "anchor-fundamentals", enrollments: 187, completions: 45, xpAwarded: 270000 },
  { id: "token-2022-deep-dive", enrollments: 98, completions: 23, xpAwarded: 138000 },
  { id: "defi-basics", enrollments: 156, completions: 34, xpAwarded: 204000 },
  { id: "nft-masterclass", enrollments: 112, completions: 28, xpAwarded: 168000 },
];

export default function AdminPage() {
  const t = useTranslations("common");

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-muted-foreground">Platform analytics and course management</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { label: "Total Users", value: MOCK_STATS.totalUsers, icon: Users, color: "text-superteam-blue" },
          { label: "Courses", value: MOCK_STATS.totalCourses, icon: BookOpen, color: "text-superteam-purple" },
          { label: "XP Minted", value: MOCK_STATS.totalXpMinted.toLocaleString(), icon: Zap, color: "text-superteam-green" },
          { label: "Credentials", value: MOCK_STATS.totalCredentials, icon: Trophy, color: "text-superteam-orange" },
          { label: "Active Enrollments", value: MOCK_STATS.activeEnrollments, icon: TrendingUp, color: "text-primary" },
          { label: "Weekly Active", value: MOCK_STATS.weeklyActiveUsers, icon: Activity, color: "text-superteam-pink" },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <stat.icon className={`h-8 w-8 ${stat.color}`} />
              <div>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Course Management */}
      <Tabs defaultValue="courses">
        <TabsList>
          <TabsTrigger value="courses">Courses</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
        </TabsList>

        <TabsContent value="courses">
          <Card>
            <CardHeader>
              <CardTitle>Course Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border text-xs text-muted-foreground">
                    <th className="p-3 text-left">Course</th>
                    <th className="p-3 text-right">Enrollments</th>
                    <th className="p-3 text-right">Completions</th>
                    <th className="p-3 text-right hidden sm:table-cell">Completion Rate</th>
                    <th className="p-3 text-right hidden md:table-cell">XP Awarded</th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_COURSES.map((course) => (
                    <tr
                      key={course.id}
                      className="border-b border-border/50 hover:bg-accent/50"
                    >
                      <td className="p-3 font-medium text-sm">
                        {course.id.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                      </td>
                      <td className="p-3 text-right text-sm">{course.enrollments}</td>
                      <td className="p-3 text-right text-sm">{course.completions}</td>
                      <td className="p-3 text-right text-sm hidden sm:table-cell">
                        {Math.round((course.completions / course.enrollments) * 100)}%
                      </td>
                      <td className="p-3 text-right text-sm hidden md:table-cell text-superteam-green">
                        {course.xpAwarded.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              User management available when Supabase is connected.
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
