import { db } from "@/drizzle/db"
import {
  CourseTable,
  UserTable,
  UserCourseAccessTable,
  UserLessonCompleteTable,
  XpEventTable,
} from "@/drizzle/schema"
import { count, sum, desc, eq } from "drizzle-orm"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Users,
  GraduationCap,
  Zap,
  Award,
  TrendingUp,
  BookOpen,
  CheckCircle,
} from "lucide-react"
import { formatNumber } from "@/lib/formatters"

export default async function AdminPage() {
  const [
    totalUsers,
    totalEnrollments,
    totalLessonCompletions,
    totalXpAwarded,
    topCourses,
    topLearners,
    recentEnrollments,
    xpByReason,
  ] = await Promise.all([
    getTotalUsers(),
    getTotalEnrollments(),
    getTotalLessonCompletions(),
    getTotalXpAwarded(),
    getTopCoursesByEnrollment(),
    getTopLearnersByXp(),
    getRecentEnrollments(),
    getXpByReason(),
  ])

  const avgLessonsPerEnrollee =
    totalEnrollments > 0
      ? (totalLessonCompletions / totalEnrollments).toFixed(1)
      : "0"

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-1">Dashboard Overview</h1>
        <p className="text-muted-foreground text-sm">Superteam Brazil Academy platform metrics</p>
      </div>

      {/* Top-line KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Learners" value={formatNumber(totalUsers)} icon={Users} />
        <StatCard title="Enrollments" value={formatNumber(totalEnrollments)} icon={GraduationCap} />
        <StatCard title="Lessons Completed" value={formatNumber(totalLessonCompletions)} icon={CheckCircle} />
        <StatCard title="Total XP Awarded" value={formatNumber(totalXpAwarded)} icon={Zap} />
      </div>

      {/* Secondary metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Lessons / Enrollee</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{avgLessonsPerEnrollee}</p>
            <p className="text-xs text-muted-foreground mt-1">lessons completed per enrolled learner</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">XP Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-1">
            {xpByReason.map((r) => (
              <div key={r.reason} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground capitalize">{r.reason.replace(/_/g, " ")}</span>
                <span className="font-semibold tabular-nums">{formatNumber(r.total)} XP</span>
              </div>
            ))}
            {xpByReason.length === 0 && (
              <p className="text-xs text-muted-foreground">No XP events yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top courses */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BookOpen className="w-4 h-4 text-primary" />
              Top Courses by Enrollment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {topCourses.map((course, i) => (
              <div key={course.id} className="flex items-center gap-3">
                <span className="text-xs font-bold text-muted-foreground w-4 shrink-0">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{course.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{course.track} · {course.difficulty}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold">{formatNumber(course.enrollments)}</p>
                  <p className="text-xs text-muted-foreground">enrolled</p>
                </div>
              </div>
            ))}
            {topCourses.length === 0 && <p className="text-sm text-muted-foreground">No enrollments yet</p>}
          </CardContent>
        </Card>

        {/* Top learners */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Award className="w-4 h-4 text-primary" />
              Top Learners by XP
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {topLearners.map((learner, i) => (
              <div key={learner.id} className="flex items-center gap-3">
                <span className="text-xs font-bold text-muted-foreground w-4 shrink-0">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{learner.name ?? "Anonymous"}</p>
                  <p className="text-xs text-muted-foreground truncate">{learner.email}</p>
                </div>
                <Badge variant="outline" className="border-primary/30 text-primary text-xs shrink-0">
                  {formatNumber(learner.xp ?? 0)} XP
                </Badge>
              </div>
            ))}
            {topLearners.length === 0 && <p className="text-sm text-muted-foreground">No learners yet</p>}
          </CardContent>
        </Card>
      </div>

      {/* Recent enrollments */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="w-4 h-4 text-primary" />
            Recent Enrollments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {recentEnrollments.map((e) => (
              <div key={`${e.userId}-${e.courseId}`} className="flex items-center justify-between text-sm py-1 border-b border-border/50 last:border-0">
                <div className="flex-1 min-w-0">
                  <span className="font-medium">{e.userName ?? "Anonymous"}</span>
                  <span className="text-muted-foreground"> enrolled in </span>
                  <span className="font-medium">{e.courseName}</span>
                </div>
                <span className="text-xs text-muted-foreground shrink-0 ml-4">
                  {e.createdAt.toLocaleDateString()}
                </span>
              </div>
            ))}
            {recentEnrollments.length === 0 && <p className="text-sm text-muted-foreground">No enrollments yet</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function StatCard({
  title,
  value,
  icon: Icon,
}: {
  title: string
  value: string
  icon: React.ComponentType<{ className?: string }>
}) {
  return (
    <Card className="relative overflow-hidden border-border bg-card">
      <div className="absolute inset-x-0 top-0 h-0.5 bg-primary" />
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
          <div className="p-2 rounded-lg bg-primary/10">
            <Icon className="w-4 h-4 text-primary" />
          </div>
        </div>
        <p className="text-3xl font-bold">{value}</p>
      </CardHeader>
    </Card>
  )
}

async function getTotalUsers() {
  const [r] = await db.select({ total: count(UserTable.id) }).from(UserTable)
  return r?.total ?? 0
}

async function getTotalEnrollments() {
  const [r] = await db.select({ total: count() }).from(UserCourseAccessTable)
  return r?.total ?? 0
}

async function getTotalLessonCompletions() {
  const [r] = await db.select({ total: count() }).from(UserLessonCompleteTable)
  return r?.total ?? 0
}

async function getTotalXpAwarded() {
  const [r] = await db.select({ total: sum(XpEventTable.amount) }).from(XpEventTable)
  return Number(r?.total ?? 0)
}

async function getTopCoursesByEnrollment() {
  return db
    .select({
      id: CourseTable.id,
      name: CourseTable.name,
      track: CourseTable.track,
      difficulty: CourseTable.difficulty,
      enrollments: count(UserCourseAccessTable.userId),
    })
    .from(CourseTable)
    .leftJoin(UserCourseAccessTable, eq(UserCourseAccessTable.courseId, CourseTable.id))
    .groupBy(CourseTable.id)
    .orderBy(desc(count(UserCourseAccessTable.userId)))
    .limit(5)
}

async function getTopLearnersByXp() {
  return db
    .select({
      id: UserTable.id,
      name: UserTable.name,
      email: UserTable.email,
      xp: UserTable.xp,
    })
    .from(UserTable)
    .orderBy(desc(UserTable.xp))
    .limit(5)
}

async function getRecentEnrollments() {
  return db
    .select({
      userId: UserCourseAccessTable.userId,
      courseId: UserCourseAccessTable.courseId,
      createdAt: UserCourseAccessTable.createdAt,
      userName: UserTable.name,
      courseName: CourseTable.name,
    })
    .from(UserCourseAccessTable)
    .innerJoin(UserTable, eq(UserTable.id, UserCourseAccessTable.userId))
    .innerJoin(CourseTable, eq(CourseTable.id, UserCourseAccessTable.courseId))
    .orderBy(desc(UserCourseAccessTable.createdAt))
    .limit(10)
}

async function getXpByReason() {
  return db
    .select({
      reason: XpEventTable.reason,
      total: sum(XpEventTable.amount),
    })
    .from(XpEventTable)
    .groupBy(XpEventTable.reason)
    .orderBy(desc(sum(XpEventTable.amount)))
    .then(rows => rows.map(r => ({ reason: r.reason, total: Number(r.total ?? 0) })))
}
