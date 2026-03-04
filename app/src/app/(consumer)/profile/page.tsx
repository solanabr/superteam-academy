import { getCurrentUser, requireAuth } from "@/lib/current-user"
import { db } from "@/drizzle/db"
import {
  UserTable, AchievementTable, UserCourseAccessTable,
  CourseTable, UserLessonCompleteTable, CourseSectionTable, LessonTable,
} from "@/drizzle/schema"
import { eq, and, countDistinct, desc } from "drizzle-orm"
import { getLevel, getLevelProgress } from "@/services/xp"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Star, Flame, Trophy, BookOpen, Calendar, Globe,
  Twitter, Github, ExternalLink, Award, Zap,
  Shield, Edit, Wallet,
} from "lucide-react"
import Link from "next/link"
import { getServerI18n } from "@/lib/server-i18n"

const achievementMeta: Record<string, { icon: string; label: string; color: string }> = {
  first_steps: { icon: "👣", label: "First Steps", color: "#9945FF" },
  course_completer: { icon: "🎓", label: "Course Completer", color: "#9945FF" },
  speed_runner: { icon: "⚡", label: "Speed Runner", color: "#F59E0B" },
  perfect_score: { icon: "💯", label: "Perfect Score", color: "#00C2FF" },
  week_warrior: { icon: "🔥", label: "Week Warrior", color: "#EF4444" },
  monthly_master: { icon: "📅", label: "Monthly Master", color: "#9945FF" },
  consistency_king: { icon: "👑", label: "Consistency King", color: "#F59E0B" },
  rust_rookie: { icon: "🦀", label: "Rust Rookie", color: "#F59E0B" },
  anchor_expert: { icon: "⚓", label: "Anchor Expert", color: "#00C2FF" },
  full_stack_solana: { icon: "🌐", label: "Full Stack Solana", color: "#9945FF" },
  early_adopter: { icon: "🚀", label: "Early Adopter", color: "#9945FF" },
  bug_hunter: { icon: "🐛", label: "Bug Hunter", color: "#EF4444" },
  first_enrollment: { icon: "📚", label: "First Enrollment", color: "#9945FF" },
}

export default async function ProfilePage() {
  const user = await getCurrentUser()
  if (!user) redirect("/sign-in")
  const { t } = await getServerI18n()

  const [achievements, completedCourses] = await Promise.all([
    db.query.AchievementTable.findMany({
      where: eq(AchievementTable.userId, user.id),
      orderBy: [desc(AchievementTable.awardedAt)],
    }),
    getCompletedCourses(user.id),
  ])

  const level = getLevel(user.xp)
  const levelProgress = getLevelProgress(user.xp)
  const nextLevelXp = (level + 1) * (level + 1) * 100
  const currentLevelXp = level * level * 100

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Profile Header */}
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 overflow-hidden">
        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-start gap-6">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-bold bg-primary"
              >
                {user.image ? (
                  <img src={user.image} alt="" className="w-full h-full rounded-2xl object-cover" />
                ) : (
                  <span className="text-white">{user.name?.charAt(0) ?? "U"}</span>
                )}
              </div>
              <div className="absolute -bottom-2 -right-2 w-7 h-7 rounded-lg bg-primary flex items-center justify-center text-xs font-bold text-white">
                {level}
              </div>
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div>
                  <h1 className="text-2xl font-bold">{user.name}</h1>
                  {user.username && (
                    <p className="text-muted-foreground text-sm">@{user.username}</p>
                  )}
                </div>
                <Link href="/settings">
                  <Button variant="outline" size="sm" className="border-border">
                    <Edit className="w-3.5 h-3.5 mr-1.5" />
                    {t("profilePage.editProfile", "Edit Profile")}
                  </Button>
                </Link>
              </div>

              {user.bio && (
                <p className="text-sm text-muted-foreground mt-3 max-w-lg">{user.bio}</p>
              )}

              {/* Links */}
              <div className="flex flex-wrap gap-3 mt-3">
                {user.walletAddress && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Wallet className="w-3.5 h-3.5 text-primary" />
                    <span className="font-mono">
                      {user.walletAddress.slice(0, 4)}...{user.walletAddress.slice(-4)}
                    </span>
                  </div>
                )}
                {user.twitterHandle && (
                  <a
                    href={`https://twitter.com/${user.twitterHandle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                  >
                    <Twitter className="w-3.5 h-3.5" />
                    @{user.twitterHandle}
                  </a>
                )}
                {user.githubHandle && (
                  <a
                    href={`https://github.com/${user.githubHandle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                  >
                    <Github className="w-3.5 h-3.5" />
                    {user.githubHandle}
                  </a>
                )}
                {user.websiteUrl && (
                  <a
                    href={user.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    {t("profilePage.website", "Website")}
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* XP Progress */}
          <div className="mt-6 p-4 bg-background/40 rounded-xl border border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold flex items-center gap-1.5">
                <Star className="w-4 h-4 text-primary" />
                {t("dashboard.level", "Level")} {level}
              </span>
              <span className="text-sm text-muted-foreground">
                {user.xp.toLocaleString()} / {nextLevelXp.toLocaleString()} XP
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full"
                style={{ width: `${Math.min(levelProgress, 100)}%` }}
              />
            </div>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="text-center">
              <p className="text-xl font-bold text-primary">{user.xp.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">{t("dashboard.totalXp", "Total XP")}</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold">{user.streak}</p>
              <p className="text-xs text-muted-foreground">{t("dashboard.streak", "Day Streak")}</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold">{completedCourses.length}</p>
              <p className="text-xs text-muted-foreground">{t("dashboard.completed", "Completed")}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Achievements */}
      <section>
        <h2 className="text-lg font-bold mb-4">{t("profilePage.achievements", "Achievements")}</h2>
        {achievements.length === 0 ? (
          <div className="text-center py-10 bg-card border border-dashed border-border rounded-xl">
            <Award className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">{t("profilePage.noAchievements", "No achievements yet - start learning!")}</p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-3">
            {achievements.map((a) => {
              const meta = achievementMeta[a.type] ?? { icon: "🏆", label: a.type, color: "#9945FF" }
              return (
                <div
                  key={a.id}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-card hover:border-primary/30 transition-colors"
                  title={`Earned ${new Date(a.awardedAt).toLocaleDateString()}`}
                >
                  <span className="text-lg">{meta.icon}</span>
                  <div>
                    <p className="text-xs font-semibold">{meta.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(a.awardedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* On-chain Credentials */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-lg font-bold">{t("profilePage.onchainCredentials", "On-Chain Credentials")}</h2>
          <Badge variant="outline" className="text-xs border-primary/30 text-primary">
            Devnet
          </Badge>
        </div>
        {!user.walletAddress ? (
          <div className="text-center py-10 bg-card border border-dashed border-border rounded-xl">
            <Shield className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
            <p className="font-medium mb-2">{t("profilePage.connectWallet", "Connect your wallet")}</p>
            <p className="text-sm text-muted-foreground mb-4">
              {t("profilePage.connectWalletDesc", "Link a Solana wallet to receive on-chain credentials when you complete courses")}
            </p>
            <Link href="/settings">
              <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
                {t("profilePage.connectWalletCta", "Connect Wallet")}
              </Button>
            </Link>
          </div>
        ) : (
          <div className="text-center py-10 bg-card border border-dashed border-border rounded-xl">
            <Shield className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">
              {t("profilePage.credentialsPlaceholder", "Complete courses to receive soulbound NFT credentials")}
            </p>
          </div>
        )}
      </section>

      {/* Completed Courses */}
      {completedCourses.length > 0 && (
        <section>
          <h2 className="text-lg font-bold mb-4">{t("profilePage.completedCourses", "Completed Courses")}</h2>
          <div className="space-y-3">
            {completedCourses.map((course) => (
              <Link key={course.id} href={`/courses/${course.slug ?? course.id}`}>
                <div className="flex items-center gap-4 p-4 bg-card border border-border rounded-xl hover:border-primary/30 transition-all">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{course.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{course.track}</p>
                  </div>
                  <Badge variant="outline" className="text-xs border-primary/30 text-primary flex-shrink-0">
                    {t("dashboard.completed", "Completed")}
                  </Badge>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

async function getCompletedCourses(userId: string) {
  const courses = await db
    .select({
      id: CourseTable.id,
      name: CourseTable.name,
      slug: CourseTable.slug,
      track: CourseTable.track,
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
    .groupBy(CourseTable.id, CourseTable.name, CourseTable.slug, CourseTable.track)

  return courses.filter((c) => c.totalLessons > 0 && c.completedLessons >= c.totalLessons)
}
