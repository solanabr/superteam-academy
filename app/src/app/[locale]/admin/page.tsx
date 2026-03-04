import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Award, Zap, BookOpen } from "lucide-react";
import { getTranslations } from "next-intl/server";

export default async function AdminDashboardPage() {
  const t = await getTranslations("AdminDashboard");

  const totalUsers = await prisma.user.count();
  const totalCourses = await prisma.course.count();
  const totalLessonsCompleted = await prisma.lessonProgress.count({ where: { status: "completed" } });
  const xpAggregate = await prisma.user.aggregate({ _sum: { xp: true } });
  const totalXpIssued = xpAggregate._sum.xp || 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="bg-gradient-to-r from-fuchsia-200 to-cyan-200 bg-clip-text text-3xl font-bold tracking-tight text-transparent">{t("title")}</h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-white/10 bg-black/25 backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("totalUsers")}</CardTitle>
            <Users className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{totalUsers}</div></CardContent>
        </Card>
        <Card className="border-white/10 bg-black/25 backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("lessonsCompleted")}</CardTitle>
            <Award className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{totalLessonsCompleted}</div></CardContent>
        </Card>
        <Card className="border-white/10 bg-black/25 backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("totalXp")}</CardTitle>
            <Zap className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{totalXpIssued.toLocaleString()}</div></CardContent>
        </Card>
        <Card className="border-white/10 bg-black/25 backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("publishedCourses")}</CardTitle>
            <BookOpen className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{totalCourses}</div></CardContent>
        </Card>
      </div>
    </div>
  );
}
