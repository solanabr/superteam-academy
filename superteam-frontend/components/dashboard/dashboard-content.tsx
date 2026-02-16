import Link from "next/link"
import {
  Zap,
  Flame,
  Trophy,
  ArrowRight,
  BookOpen,
  Clock,
  Award,
  Target,
  TrendingUp,
  Swords,
  Footprints,
  Bug,
  Building,
  Anchor,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  currentUser,
  type Course,
  courses as mockCourses,
  recentActivity,
  getStreakDays,
} from "@/lib/mock-data"
import type { IdentitySnapshot } from "@/lib/identity/types"
import { LeaderboardWidget } from "./leaderboard-widget"

const badgeIcons: Record<string, typeof Zap> = {
  footprints: Footprints,
  swords: Swords,
  flame: Flame,
  trophy: Trophy,
  bug: Bug,
  building: Building,
  anchor: Anchor,
  zap: Zap,
}

export function DashboardContent({
  identity,
  coursesData,
}: {
  identity?: IdentitySnapshot
  coursesData?: Course[]
}) {
  const courses = coursesData ?? mockCourses
  const profile = identity?.profile
  const inProgressCourses = courses.filter(
    c => c.progress > 0 && c.progress < 100,
  )
  const recommendedCourses = courses.filter(c => c.progress === 0).slice(0, 2)
  const streakDays = getStreakDays(365)
  const heatmap = buildContributionHeatmap(streakDays)

  return (
    <div>
      {/* Welcome header */}
      <div className="flex flex-col gap-4 mb-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground lg:text-3xl">
            Welcome back, {(profile?.name ?? currentUser.name).split(" ")[0]}
          </h1>
          <p className="mt-1 text-muted-foreground">
            Keep up the momentum! You{"'"}re on a{" "}
            {profile?.streak ?? currentUser.streak}-day streak.
          </p>
        </div>
        <Link href="/courses">
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
            <BookOpen className="h-4 w-4" />
            Browse Courses
          </Button>
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 mb-8 lg:grid-cols-4">
        <StatCard
          icon={Zap}
          label="Total XP"
          value={(profile?.xp ?? currentUser.xp).toLocaleString()}
          color="text-primary"
          bgColor="bg-primary/10"
        />
        <StatCard
          icon={Flame}
          label="Day Streak"
          value={`${profile?.streak ?? currentUser.streak}`}
          color="text-[hsl(var(--gold))]"
          bgColor="bg-[hsl(var(--gold))]/10"
        />
        <StatCard
          icon={Trophy}
          label="Global Rank"
          value={`#${profile?.rank ?? currentUser.rank}`}
          color="text-primary"
          bgColor="bg-primary/10"
        />
        <StatCard
          icon={Target}
          label="Level"
          value={`${profile?.level ?? currentUser.level}`}
          color="text-[hsl(var(--gold))]"
          bgColor="bg-[hsl(var(--gold))]/10"
        />
      </div>

      {/* Level progress */}
      <div className="rounded-xl border border-border bg-card p-5 mb-8">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground">
              Level {profile?.level ?? currentUser.level}
            </span>
          </div>
          <span className="text-xs text-muted-foreground">
            {(profile?.xp ?? currentUser.xp).toLocaleString()} /{" "}
            {(profile?.xpToNext ?? currentUser.xpToNext).toLocaleString()} XP
          </span>
        </div>
        <Progress
          value={
            ((profile?.xp ?? currentUser.xp) /
              (profile?.xpToNext ?? currentUser.xpToNext)) *
            100
          }
          className="h-2.5 bg-secondary [&>div]:bg-gradient-to-r [&>div]:from-primary [&>div]:to-[hsl(var(--gold))]"
        />
        <p className="text-xs text-muted-foreground mt-2">
          {(
            (profile?.xpToNext ?? currentUser.xpToNext) -
            (profile?.xp ?? currentUser.xp)
          ).toLocaleString()}{" "}
          XP until Level {(profile?.level ?? currentUser.level) + 1}
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main content - 2 cols */}
        <div className="lg:col-span-2 space-y-8">
          {/* Current courses */}
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Continue Learning
            </h2>
            <div className="space-y-3">
              {inProgressCourses.map(course => {
                // Find next lesson
                let nextLesson = null
                for (const mod of course.modules) {
                  for (const l of mod.lessons) {
                    if (!l.completed) {
                      nextLesson = l
                      break
                    }
                  }
                  if (nextLesson) break
                }
                return (
                  <div
                    key={course.slug}
                    className="rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/20"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-base font-semibold text-foreground truncate">
                            {course.title}
                          </h3>
                          <Badge
                            variant="outline"
                            className="text-[10px] border-border text-muted-foreground shrink-0"
                          >
                            {course.difficulty}
                          </Badge>
                        </div>
                        {nextLesson && (
                          <p className="text-sm text-muted-foreground">
                            Next: {nextLesson.title}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-3">
                          <Progress
                            value={course.progress}
                            className="h-1.5 flex-1 bg-secondary [&>div]:bg-primary"
                          />
                          <span className="text-xs font-medium text-primary shrink-0">
                            {course.progress}%
                          </span>
                        </div>
                      </div>
                      <Link
                        href={`/courses/${course.slug}/lessons/${
                          nextLesson?.id || "1-1"
                        }`}
                      >
                        <Button
                          size="sm"
                          className="bg-primary text-primary-foreground hover:bg-primary/90 gap-1 shrink-0"
                        >
                          Resume
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          {/* Streak calendar */}
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Activity Streak
            </h2>
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center gap-3 mb-2">
                <Flame className="h-5 w-5 text-[hsl(var(--gold))] animate-fire" />
                <span className="text-sm font-semibold text-foreground">
                  {currentUser.streak} day streak!
                </span>
              </div>

              <p className="mb-3 text-xs text-muted-foreground">
                {heatmap.activeDays} active days in the last year
              </p>

              <div className="overflow-x-auto">
                <div className="min-w-[760px]">
                  <div className="ml-8 mb-2 flex gap-1 text-[10px] text-muted-foreground">
                    {heatmap.weeks.map((week, weekIndex) => {
                      const showLabel =
                        weekIndex === 0 ||
                        week[0].getMonth() !==
                          heatmap.weeks[weekIndex - 1][0].getMonth()

                      return (
                        <div key={week[0].toISOString()} className="w-3">
                          {showLabel ? monthLabel(week[0]) : ""}
                        </div>
                      )
                    })}
                  </div>

                  <div className="flex gap-2">
                    <div className="grid grid-rows-7 gap-1 text-[10px] text-muted-foreground">
                      <span />
                      <span>Mon</span>
                      <span />
                      <span>Wed</span>
                      <span />
                      <span>Fri</span>
                      <span />
                    </div>

                    <div className="flex gap-1">
                      {heatmap.weeks.map(week => (
                        <div
                          key={week[0].toISOString()}
                          className="grid grid-rows-7 gap-1"
                        >
                          {week.map(date => {
                            const dateKey = toDateKey(date)
                            const intensity =
                              heatmap.intensityByDate.get(dateKey) ?? 0
                            return (
                              <div
                                key={dateKey}
                                className={`h-3 w-3 rounded-[3px] border border-border/40 ${intensityClass(
                                  intensity,
                                )}`}
                                title={`${dateKey}: ${
                                  intensity > 0
                                    ? `${intensity} activities`
                                    : "No activity"
                                }`}
                              />
                            )
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 mt-3">
                <span className="text-[10px] text-muted-foreground">Less</span>
                <div className="flex gap-1">
                  <div className="h-3 w-3 rounded-[3px] border border-border/40 bg-secondary" />
                  <div className="h-3 w-3 rounded-[3px] border border-border/40 bg-emerald-900/55" />
                  <div className="h-3 w-3 rounded-[3px] border border-border/40 bg-emerald-700/70" />
                  <div className="h-3 w-3 rounded-[3px] border border-border/40 bg-emerald-500/85" />
                  <div className="h-3 w-3 rounded-[3px] border border-border/40 bg-emerald-400" />
                </div>
                <span className="text-[10px] text-muted-foreground">More</span>
              </div>
            </div>
          </section>

          {/* Recommended courses */}
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Recommended for You
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {recommendedCourses.map(course => (
                <Link key={course.slug} href={`/courses/${course.slug}`}>
                  <div className="rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/20 h-full">
                    <Badge
                      variant="outline"
                      className="text-[10px] border-border text-muted-foreground mb-3"
                    >
                      {course.difficulty}
                    </Badge>
                    <h3 className="text-base font-semibold text-foreground mb-1">
                      {course.title}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {course.description}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {course.duration}
                      </span>
                      <span className="flex items-center gap-1">
                        <Zap className="h-3 w-3 text-primary" /> {course.xp} XP
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </div>

        {/* Sidebar - 1 col */}
        <div className="space-y-6">
          <LeaderboardWidget />
          {/* Badges */}
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Achievements
            </h2>
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="grid grid-cols-4 gap-3">
                {currentUser.badges.map(badge => {
                  const Icon = badgeIcons[badge.icon] || Award
                  return (
                    <div
                      key={badge.name}
                      className="flex flex-col items-center gap-1.5"
                      title={`${badge.name}: ${badge.description}`}
                    >
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                          badge.earned
                            ? "bg-primary/10 border border-primary/20"
                            : "bg-secondary border border-border opacity-40"
                        }`}
                      >
                        <Icon
                          className={`h-4 w-4 ${
                            badge.earned
                              ? "text-primary"
                              : "text-muted-foreground"
                          }`}
                        />
                      </div>
                      <span className="text-[10px] text-muted-foreground text-center leading-tight truncate w-full">
                        {badge.name}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </section>

          {/* Recent activity */}
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Recent Activity
            </h2>
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="divide-y divide-border">
                {recentActivity.map((activity, i) => (
                  <div key={i} className="flex items-start gap-3 px-4 py-3">
                    <div className="mt-0.5">
                      {activity.type === "challenge" ? (
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
                          <Zap className="h-3 w-3 text-primary" />
                        </div>
                      ) : activity.type === "streak" ? (
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[hsl(var(--gold))]/10">
                          <Flame className="h-3 w-3 text-[hsl(var(--gold))]" />
                        </div>
                      ) : activity.type === "badge" ? (
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
                          <Award className="h-3 w-3 text-primary" />
                        </div>
                      ) : (
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary">
                          <BookOpen className="h-3 w-3 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground">
                        {activity.text}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {activity.course && (
                          <span className="text-xs text-muted-foreground truncate">
                            {activity.course}
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {activity.time}
                        </span>
                      </div>
                    </div>
                    <span className="flex items-center gap-0.5 text-xs text-primary shrink-0">
                      <Zap className="h-3 w-3" />+{activity.xp}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  bgColor,
}: {
  icon: typeof Zap
  label: string
  value: string
  color: string
  bgColor: string
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div
        className={`flex h-9 w-9 items-center justify-center rounded-lg ${bgColor} mb-3`}
      >
        <Icon className={`h-4 w-4 ${color}`} />
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </div>
  )
}

function toDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, "0")
  const day = `${date.getDate()}`.padStart(2, "0")
  return `${year}-${month}-${day}`
}

function fromDateKey(dateKey: string): Date {
  const [year, month, day] = dateKey.split("-").map(Number)
  return new Date(year, month - 1, day)
}

function monthLabel(date: Date): string {
  return date.toLocaleString("en-US", { month: "short" })
}

function intensityClass(intensity: number): string {
  if (intensity <= 0) return "bg-secondary"
  if (intensity === 1) return "bg-emerald-900/55"
  if (intensity === 2) return "bg-emerald-700/70"
  if (intensity === 3) return "bg-emerald-500/85"
  return "bg-emerald-400"
}

function buildContributionHeatmap(
  streakDays: Array<{ date: string; intensity: number }>,
): {
  weeks: Date[][]
  intensityByDate: Map<string, number>
  activeDays: number
} {
  if (streakDays.length === 0) {
    return { weeks: [], intensityByDate: new Map<string, number>(), activeDays: 0 }
  }

  const intensityByDate = new Map<string, number>()
  for (const day of streakDays) {
    intensityByDate.set(day.date, day.intensity)
  }

  const activeDays = streakDays.filter(day => day.intensity > 0).length

  const latestDate = fromDateKey(streakDays[streakDays.length - 1].date)
  const earliestDate = fromDateKey(streakDays[0].date)

  const gridStart = new Date(earliestDate)
  gridStart.setDate(gridStart.getDate() - gridStart.getDay())

  const gridEnd = new Date(latestDate)
  gridEnd.setDate(gridEnd.getDate() + (6 - gridEnd.getDay()))

  const days: Date[] = []
  for (
    const cursor = new Date(gridStart);
    cursor <= gridEnd;
    cursor.setDate(cursor.getDate() + 1)
  ) {
    days.push(new Date(cursor))
  }

  const weeks: Date[][] = []
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7))
  }

  return { weeks, intensityByDate, activeDays }
}
