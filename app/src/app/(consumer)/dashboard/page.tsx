import { getCurrentUser } from "@/lib/current-user"
import { db } from "@/drizzle/db"
import {
  CourseTable, UserCourseAccessTable, UserLessonCompleteTable,
  CourseSectionTable, LessonTable, AchievementTable,
} from "@/drizzle/schema"
import { eq, and, countDistinct, desc } from "drizzle-orm"
import { getLeaderboard, getLevel, getLevelProgress, getXPBalance } from "@/services/xp"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Flame, BookOpen, Star, Award, ChevronRight,
} from "lucide-react"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { DEFAULT_LOCALE, isAppLocale } from "@/lib/locale"
import { getFallbackMessages, getMessages } from "@/lib/messages"

function resolvePath(messageMap: Record<string, unknown>, key: string): string | null {
  const segments = key.split(".")
  let current: unknown = messageMap
  for (const segment of segments) {
    if (typeof current !== "object" || current == null) return null
    current = (current as Record<string, unknown>)[segment]
  }
  return typeof current === "string" ? current : null
}

export default async function DashboardPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/sign-in")
  const cookieStore = await cookies()
  const cookieLocale = cookieStore.get("locale")?.value
  const locale = isAppLocale(cookieLocale) ? cookieLocale : DEFAULT_LOCALE
  const messages = getMessages(locale)
  const fallbackMessages = getFallbackMessages()
  const t = (key: string, fallback: string) =>
    resolvePath(messages, key) ?? resolvePath(fallbackMessages, key) ?? fallback

  const [userCourses, recentAchievements, xp, leaderboardAll] = await Promise.all([
    getUserCoursesWithProgress(user.id),
    getRecentAchievements(user.id),
    getXPBalance(user.id),
    getLeaderboard("all", 100),
  ])
  const leaderboard = leaderboardAll.slice(0, 5)

  const level = getLevel(xp)
  const levelProgress = getLevelProgress(xp)
  const nextLevelXp = (level + 1) * (level + 1) * 100
  const currentLevelXp = level * level * 100

  const inProgressCourses = userCourses.filter(c => c.progressPercent < 100 && c.progressPercent > 0)
  const completedCourses = userCourses.filter(c => c.progressPercent === 100)
  const currentUserRank = (() => {
    const found = leaderboardAll.find((entry) => entry.userId === user.id || entry.walletAddress === user.walletAddress)
    if (found) return found.rank
    return null
  })()

  const getDisplayName = (entry: (typeof leaderboard)[number]) => {
    const isCurrentUser =
      user.id === entry.userId || (Boolean(user.walletAddress) && user.walletAddress === entry.walletAddress)

    if (isCurrentUser && user.name?.trim()) return user.name
    if (entry.name?.trim()) return entry.name
    if (entry.username?.trim()) return `@${entry.username}`
    if (entry.walletAddress) return `${entry.walletAddress.slice(0, 4)}...${entry.walletAddress.slice(-4)}`
    return t("dashboard.anonymous", "Anonymous")
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {t("dashboard.greeting", "Welcome back")}, {user.name?.split(" ")[0] ?? t("dashboard.builder", "Builder")} 👋
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {new Intl.DateTimeFormat(locale, { weekday: "long", month: "long", day: "numeric" }).format(new Date())}
          </p>
        </div>
        <Link href="/courses">
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
            <BookOpen className="w-4 h-4 mr-2" />
            {t("dashboard.browseCourses", "Browse Courses")}
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* XP / Level card */}
        <Card className="col-span-2 bg-gradient-to-br from-primary/20 to-primary/10 border-primary/30">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                  <Star className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t("dashboard.level", "Level")}</p>
                  <p className="text-2xl font-bold">{level}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">{t("dashboard.totalXp", "Total XP")}</p>
                <p className="text-2xl font-bold text-primary">{xp.toLocaleString()}</p>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{t("dashboard.level", "Level")} {level}</span>
                <span>{(xp - currentLevelXp).toLocaleString()} / {(nextLevelXp - currentLevelXp).toLocaleString()} XP</span>
                <span>{t("dashboard.level", "Level")} {level + 1}</span>
              </div>
              <div className="h-2 bg-background/50 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-700"
                  style={{ width: `${Math.min(levelProgress, 100)}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Streak */}
        <Card className="bg-card border-border">
          <CardContent className="p-5 flex flex-col justify-between h-full">
            <div className="flex items-center gap-2 mb-2">
              <Flame className="w-5 h-5 text-orange-400" />
              <p className="text-sm text-muted-foreground">{t("dashboard.streak", "Streak")}</p>
            </div>
            <p className="text-3xl font-bold">{user.streak}</p>
            <p className="text-xs text-muted-foreground">
              {user.streak === 0
                ? t("dashboard.streakStartToday", "Start today!")
                : user.streak === 1
                  ? t("dashboard.streakOneDay", "1 day — keep going!")
                  : `${user.streak} ${t("dashboard.days", "days")} 🔥`}
            </p>
          </CardContent>
        </Card>

        {/* Courses */}
        <Card className="bg-card border-border">
          <CardContent className="p-5 flex flex-col justify-between h-full">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="w-5 h-5 text-[#00C2FF]" />
              <p className="text-sm text-muted-foreground">{t("dashboard.courses", "Courses")}</p>
            </div>
            <p className="text-3xl font-bold">{userCourses.length}</p>
            <p className="text-xs text-muted-foreground">
              {completedCourses.length} {t("dashboard.completed", "completed")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Continue Learning */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">{t("dashboard.continuelearning", "Continue Learning")}</h2>
          <Link href="/courses" className="text-sm text-primary hover:text-primary/80 flex items-center gap-1">
            {t("dashboard.viewAll", "View all")} <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {inProgressCourses.length === 0 ? (
          <Card className="bg-card border-border border-dashed">
            <CardContent className="p-8 text-center">
              <BookOpen className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="font-semibold mb-1">{t("dashboard.noCoursesInProgress", "No courses in progress")}</p>
              <p className="text-sm text-muted-foreground mb-4">
                {t("dashboard.pickCoursePrompt", "Pick a course and start building on Solana")}
              </p>
              <Link href="/courses">
                <Button variant="outline" size="sm">{t("dashboard.browseCourses", "Browse Courses")}</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {inProgressCourses.slice(0, 3).map((course) => (
              <Link key={course.id} href={`/courses/${course.id}`}>
                <Card className="bg-card border-border hover:border-primary/40 transition-all hover:-translate-y-0.5 cursor-pointer h-full">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <Badge variant="outline" className="text-xs border-border capitalize">
                        {course.difficulty ?? t("dashboard.beginner", "beginner")}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{course.progressPercent}%</span>
                    </div>
                    <h3 className="font-semibold mb-1 line-clamp-2">{course.name}</h3>
                    <p className="text-xs text-muted-foreground mb-4">
                      {course.completedLessons}/{course.totalLessons} {t("dashboard.lessons", "lessons")}
                    </p>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${course.progressPercent}%` }}
                      />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Recent Achievements */}
      {recentAchievements.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">{t("dashboard.achievements", "Recent Achievements")}</h2>
            <Link href="/profile" className="text-sm text-primary hover:text-primary/80 flex items-center gap-1">
              {t("dashboard.viewAll", "View all")} <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="flex flex-wrap gap-3">
            {recentAchievements.map((achievement) => (
              <div
                key={achievement.id}
                className="flex items-center gap-2 px-3 py-2 rounded-full bg-card border border-border"
              >
                <Award className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium capitalize">
                  {achievement.type.replace(/_/g, " ")}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Leaderboard Preview */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">{t("dashboard.leaderboard", "Leaderboard")}</h2>
          <Link href="/leaderboard" className="text-sm text-primary hover:text-primary/80 flex items-center gap-1">
            {t("dashboard.fullLeaderboard", "Full leaderboard")} <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="space-y-2">
              {leaderboard.length === 0 ? (
                <p className="text-xs text-center text-muted-foreground py-4">
                  {t("dashboard.noLeaderboardEntries", "No leaderboard entries yet.")}
                </p>
              ) : (
                leaderboard.map((entry) => {
                  const isCurrentUser =
                    user.id === entry.userId ||
                    (Boolean(user.walletAddress) && user.walletAddress === entry.walletAddress)
                  const displayName = getDisplayName(entry)

                  return (
                    <div
                      key={entry.userId}
                      className={`flex items-center gap-3 p-3 rounded-lg border ${
                        isCurrentUser ? "bg-primary/10 border-primary/20" : "bg-card border-border"
                      }`}
                    >
                      <div className="w-7 text-center text-xs font-semibold text-muted-foreground">
                        #{entry.rank}
                      </div>
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-sm font-bold text-white">
                        {displayName.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">
                          {displayName} {isCurrentUser ? <span className="text-primary">({t("dashboard.you", "you")})</span> : null}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {t("dashboard.level", "Level")} {entry.level} · {entry.xp.toLocaleString()} XP
                        </p>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
            <p className="text-xs text-center text-muted-foreground mt-3">
              {currentUserRank
                ? `${t("dashboard.yourRank", "Your rank")}: #${currentUserRank}`
                : t("dashboard.completeLessonsToClimb", "Complete lessons to climb the global leaderboard")}
            </p>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}

async function getUserCoursesWithProgress(userId: string) {
  const courses = await db
    .select({
      id: CourseTable.id,
      name: CourseTable.name,
      difficulty: CourseTable.difficulty,
      totalLessons: countDistinct(LessonTable.id),
      completedLessons: countDistinct(UserLessonCompleteTable.lessonId),
    })
    .from(UserCourseAccessTable)
    .innerJoin(CourseTable, eq(CourseTable.id, UserCourseAccessTable.courseId))
    .leftJoin(CourseSectionTable, eq(CourseSectionTable.courseId, CourseTable.id))
    .leftJoin(LessonTable, eq(LessonTable.sectionId, CourseSectionTable.id))
    .leftJoin(
      UserLessonCompleteTable,
      and(
        eq(UserLessonCompleteTable.lessonId, LessonTable.id),
        eq(UserLessonCompleteTable.userId, userId)
      )
    )
    .where(eq(UserCourseAccessTable.userId, userId))
    .groupBy(CourseTable.id, CourseTable.name, CourseTable.difficulty)

  return courses.map((c) => ({
    ...c,
    progressPercent: c.totalLessons > 0
      ? Math.round((c.completedLessons / c.totalLessons) * 100)
      : 0,
  }))
}

async function getRecentAchievements(userId: string) {
  return db.query.AchievementTable.findMany({
    where: eq(AchievementTable.userId, userId),
    orderBy: [desc(AchievementTable.awardedAt)],
    limit: 5,
  })
}
