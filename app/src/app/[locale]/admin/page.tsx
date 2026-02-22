"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, BookOpen, TrendingUp, BarChart3, Shield } from "lucide-react";

const STATS = [
  { label: "totalUsers", value: "2,547", icon: Users, change: "+12%" },
  { label: "activeToday", value: "342", icon: TrendingUp, change: "+5%" },
  { label: "totalEnrollments", value: "8,124", icon: BookOpen, change: "+18%" },
  { label: "completionRate", value: "67%", icon: BarChart3, change: "+3%" },
];

const USERS = [
  {
    name: "Maria Silva",
    email: "maria@example.com",
    xp: 12500,
    courses: 4,
    joined: "2026-01-05",
    status: "active",
  },
  {
    name: "Pedro Santos",
    email: "pedro@example.com",
    xp: 10200,
    courses: 3,
    joined: "2026-01-08",
    status: "active",
  },
  {
    name: "Ana Costa",
    email: "ana@example.com",
    xp: 8900,
    courses: 3,
    joined: "2026-01-10",
    status: "active",
  },
  {
    name: "Lucas Oliveira",
    email: "lucas@example.com",
    xp: 7600,
    courses: 2,
    joined: "2026-01-15",
    status: "inactive",
  },
  {
    name: "Julia Ferreira",
    email: "julia@example.com",
    xp: 6300,
    courses: 2,
    joined: "2026-01-20",
    status: "active",
  },
];

const COURSES = [
  {
    title: "Introduction to Solana",
    enrollments: 1250,
    completions: 890,
    avgRating: 4.8,
  },
  {
    title: "Anchor Framework Fundamentals",
    enrollments: 860,
    completions: 520,
    avgRating: 4.7,
  },
  {
    title: "DeFi on Solana",
    enrollments: 640,
    completions: 280,
    avgRating: 4.6,
  },
  {
    title: "NFT Development on Solana",
    enrollments: 720,
    completions: 410,
    avgRating: 4.5,
  },
  {
    title: "Web3 Frontend with Solana",
    enrollments: 980,
    completions: 650,
    avgRating: 4.9,
  },
];

export default function AdminPage() {
  const t = useTranslations("admin");
  const tc = useTranslations("common");

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8 flex items-center gap-3">
        <Shield className="h-6 w-6 text-primary" />
        <h1 className="text-3xl font-bold">{t("title")}</h1>
      </div>

      {/* Stats */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STATS.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <stat.icon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-muted-foreground">
                    {t(stat.label)}
                  </p>
                  <Badge
                    variant="secondary"
                    className="text-[10px] text-green-600"
                  >
                    {stat.change}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users">{t("userManagement")}</TabsTrigger>
          <TabsTrigger value="courses">{t("courseManagement")}</TabsTrigger>
          <TabsTrigger value="analytics">{t("analytics")}</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>{t("userManagement")}</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>{tc("xp")}</TableHead>
                    <TableHead>{tc("courses")}</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {USERS.map((user) => (
                    <TableRow key={user.email}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.xp.toLocaleString()}</TableCell>
                      <TableCell>{user.courses}</TableCell>
                      <TableCell>
                        {new Date(user.joined).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            user.status === "active" ? "default" : "secondary"
                          }
                        >
                          {user.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="courses">
          <Card>
            <CardHeader>
              <CardTitle>{t("courseManagement")}</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Course</TableHead>
                    <TableHead>Enrollments</TableHead>
                    <TableHead>Completions</TableHead>
                    <TableHead>Completion Rate</TableHead>
                    <TableHead>Avg Rating</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {COURSES.map((course) => (
                    <TableRow key={course.title}>
                      <TableCell className="font-medium">
                        {course.title}
                      </TableCell>
                      <TableCell>
                        {course.enrollments.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {course.completions.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {Math.round(
                          (course.completions / course.enrollments) * 100,
                        )}
                        %
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{course.avgRating}/5</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>{t("analytics")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="rounded-lg border p-6">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Enrollments This Week
                  </h3>
                  <p className="mt-2 text-3xl font-bold">287</p>
                  <div className="mt-4 flex items-end gap-1">
                    {[30, 45, 38, 52, 40, 48, 34].map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-t bg-primary/60"
                        style={{ height: `${h}px` }}
                      />
                    ))}
                  </div>
                  <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                    <span>Mon</span>
                    <span>Sun</span>
                  </div>
                </div>
                <div className="rounded-lg border p-6">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    XP Distributed This Week
                  </h3>
                  <p className="mt-2 text-3xl font-bold">45,200</p>
                  <div className="mt-4 flex items-end gap-1">
                    {[40, 55, 42, 60, 50, 58, 45].map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-t bg-gold/60"
                        style={{ height: `${h}px` }}
                      />
                    ))}
                  </div>
                  <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                    <span>Mon</span>
                    <span>Sun</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
}
