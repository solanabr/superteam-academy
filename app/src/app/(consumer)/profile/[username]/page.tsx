import { db } from "@/drizzle/db"
import { UserTable, UserCourseAccessTable, AchievementTable, CourseTable } from "@/drizzle/schema"
import { eq, and, countDistinct } from "drizzle-orm"
import { notFound } from "next/navigation"
import { getCurrentUser } from "@/lib/current-user"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Globe, Twitter, Github, Zap, Flame, Trophy, BookOpen,
  Shield, Star, Award, Lock, Calendar,
} from "lucide-react"
import { getLevel, getLevelProgress } from "@/services/xp"
import { getServerI18n } from "@/lib/server-i18n"

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { username } = await params
  const currentUser = await getCurrentUser()
  const { t } = await getServerI18n()

  // Find user by username
  const profileUser = await db.query.UserTable.findFirst({
    where: eq(UserTable.username, username),
    columns: {
      id: true,
      name: true,
      username: true,
      bio: true,
      image: true,
      xp: true,
      streak: true,
      websiteUrl: true,
      twitterHandle: true,
      githubHandle: true,
      isProfilePublic: true,
      createdAt: true,
    },
  })

  if (!profileUser) notFound()

  // If profile is private (and not the owner), show limited view
  const isOwner = currentUser?.id != null && currentUser.id === profileUser.id
  const canViewFull = profileUser.isProfilePublic || isOwner

  // Get achievements
  const achievements = await db.query.AchievementTable.findMany({
    where: eq(AchievementTable.userId, profileUser.id),
    orderBy: (a, { desc }) => [desc(a.awardedAt)],
    limit: 12,
  })

  // Get completed courses
  const enrollments = await db.query.UserCourseAccessTable.findMany({
    where: eq(UserCourseAccessTable.userId, profileUser.id),
    with: {
      course: {
        columns: { id: true, name: true, slug: true, track: true, xpReward: true },
      },
    },
    limit: 8,
  })

  const level = getLevel(profileUser.xp)
  const levelProgress = getLevelProgress(profileUser.xp)

  const achievementIcons: Record<string, string> = {
    first_steps: "👣", course_completer: "🎓", speed_runner: "⚡",
    week_warrior: "🔥", rust_rookie: "🦀", anchor_expert: "⚓",
    full_stack_solana: "🌐", early_adopter: "🌟", default: "🏅",
  }

  const trackIcons: Record<string, string> = {
    fundamentals: "🏗️", defi: "💱", nft: "🎨", security: "🛡️", frontend: "🖥️",
  }

  const joinYear = new Date(profileUser.createdAt).getFullYear()

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Profile Header */}
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 overflow-hidden">
        <div className="h-1 bg-primary" />
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="w-20 h-20 rounded-2xl bg-primary flex items-center justify-center text-3xl font-bold text-white overflow-hidden">
                {profileUser.image ? (
                  <img src={profileUser.image} alt={profileUser.name ?? ""} className="w-full h-full object-cover" />
                ) : (
                  (profileUser.name?.charAt(0) ?? profileUser.username?.charAt(0) ?? "U").toUpperCase()
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-white">
                {level}
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-xl font-bold">{profileUser.name ?? profileUser.username}</h1>
                {!profileUser.isProfilePublic && (
                  <Badge variant="outline" className="text-xs border-muted text-muted-foreground gap-1">
                    <Lock className="w-3 h-3" />
                    {t("profilePage.private", "Private")}
                  </Badge>
                )}
              </div>
              {profileUser.username && (
                <p className="text-sm text-muted-foreground mb-2">@{profileUser.username}</p>
              )}
              {canViewFull && profileUser.bio && (
                <p className="text-sm text-muted-foreground mb-3 max-w-lg">{profileUser.bio}</p>
              )}

              {/* Social links */}
              {canViewFull && (
                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                  {profileUser.websiteUrl && (
                    <a href={profileUser.websiteUrl} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 hover:text-primary transition-colors">
                      <Globe className="w-3.5 h-3.5" />
                      {t("profilePage.website", "Website")}
                    </a>
                  )}
                  {profileUser.twitterHandle && (
                    <a href={`https://twitter.com/${profileUser.twitterHandle}`} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 hover:text-primary transition-colors">
                      <Twitter className="w-3.5 h-3.5" />
                      @{profileUser.twitterHandle}
                    </a>
                  )}
                  {profileUser.githubHandle && (
                    <a href={`https://github.com/${profileUser.githubHandle}`} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 hover:text-primary transition-colors">
                      <Github className="w-3.5 h-3.5" />
                      {profileUser.githubHandle}
                    </a>
                  )}
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {t("profilePage.joined", "Joined")} {joinYear}
                  </span>
                </div>
              )}
            </div>

            {/* Stats */}
            {canViewFull && (
              <div className="grid grid-cols-3 sm:grid-cols-1 gap-3 sm:text-right shrink-0">
                <div>
                  <div className="flex items-center justify-end gap-1 text-primary">
                    <Zap className="w-4 h-4" />
                    <span className="font-bold text-lg">{profileUser.xp.toLocaleString()}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{t("dashboard.totalXp", "XP Total")}</p>
                </div>
                <div>
                  <div className="flex items-center justify-end gap-1 text-primary">
                    <Flame className="w-4 h-4" />
                    <span className="font-bold text-lg">{profileUser.streak}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{t("dashboard.streak", "Day Streak")}</p>
                </div>
                <div>
                  <div className="flex items-center justify-end gap-1 text-primary">
                    <BookOpen className="w-4 h-4" />
                    <span className="font-bold text-lg">{enrollments.length}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{t("dashboard.courses", "Courses")}</p>
                </div>
              </div>
            )}
          </div>

          {/* XP Level Bar */}
          {canViewFull && (
            <div className="mt-5">
              <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                <span>{t("dashboard.level", "Level")} {level}</span>
                <span>{levelProgress}% {t("profilePage.toLevel", "to Level")} {level + 1}</span>
              </div>
              <div className="h-2 bg-background/60 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500"
                  style={{ width: `${levelProgress}%` }}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {canViewFull ? (
        <>
          {/* Achievements */}
          {achievements.length > 0 && (
            <div>
              <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-[#F59E0B]" />
                {t("profilePage.achievements", "Achievements")}
                <Badge variant="outline" className="text-xs">{achievements.length}</Badge>
              </h2>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {achievements.map((ach) => (
                  <div
                    key={ach.id}
                    className="flex flex-col items-center p-3 bg-card border border-border rounded-xl text-center hover:border-primary/30 transition-colors"
                    title={ach.type.replace(/_/g, " ")}
                  >
                    <span className="text-2xl mb-1">
                      {achievementIcons[ach.type] ?? achievementIcons.default}
                    </span>
                    <span className="text-[10px] text-muted-foreground leading-tight line-clamp-2">
                      {ach.type.replace(/_/g, " ")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Courses */}
          {enrollments.length > 0 && (
            <div>
              <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                {t("dashboard.courses", "Courses")}
              </h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {enrollments.map((enrollment) => (
                  <Link
                    key={enrollment.courseId}
                    href={`/courses/${enrollment.course.slug ?? enrollment.course.id}`}
                  >
                    <div className="flex items-center gap-3 p-3 bg-card border border-border rounded-lg hover:border-primary/30 transition-colors">
                      <span className="text-xl">{trackIcons[enrollment.course.track] ?? "📚"}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm line-clamp-1">{enrollment.course.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">{enrollment.course.track}</p>
                      </div>
                      <div className="flex items-center gap-0.5 text-xs text-primary shrink-0">
                        <Zap className="w-3 h-3" />
                        {enrollment.course.xpReward}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* On-chain credentials placeholder */}
          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <h2 className="font-semibold mb-3 flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" />
                {t("profilePage.onchainCredentials", "On-Chain Credentials")}
              </h2>
              <div className="flex items-center gap-3 p-3 bg-primary/5 border border-primary/10 rounded-lg">
                <Award className="w-8 h-8 text-primary/40" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t("profilePage.noCredentials", "No credentials yet")}</p>
                  <p className="text-xs text-muted-foreground">
                    {t("profilePage.noCredentialsDesc", "Complete courses to earn soulbound NFT credentials on Solana")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card className="bg-card border-border">
          <CardContent className="py-16 text-center">
            <Lock className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
            <p className="font-semibold mb-1">{t("profilePage.privateProfile", "This profile is private")}</p>
            <p className="text-sm text-muted-foreground">
              {profileUser.name ?? profileUser.username} {t("profilePage.privateProfileDesc", "has set their profile to private.")}
            </p>
          </CardContent>
        </Card>
      )}

      {isOwner && (
        <div className="flex justify-center">
          <Link href="/settings">
            <Button variant="outline" size="sm">{t("profilePage.editProfile", "Edit Profile")}</Button>
          </Link>
        </div>
      )}
    </div>
  )
}
