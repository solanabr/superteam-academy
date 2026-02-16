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
import { currentUser, courses, recentActivity, getStreakDays } from "@/lib/mock-data"

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

export function DashboardContent() {
  const inProgressCourses = courses.filter((c) => c.progress > 0 && c.progress < 100)
  const recommendedCourses = courses.filter((c) => c.progress === 0).slice(0, 2)
  const streakDays = getStreakDays()

  return (
    <div>
      {/* Welcome header */}
      <div className="flex flex-col gap-4 mb-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground lg:text-3xl">
            Welcome back, {currentUser.name.split(" ")[0]}
          </h1>
          <p className="mt-1 text-muted-foreground">
            Keep up the momentum! You{"'"}re on a {currentUser.streak}-day streak.
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
          value={currentUser.xp.toLocaleString()}
          color="text-primary"
          bgColor="bg-primary/10"
        />
        <StatCard
          icon={Flame}
          label="Day Streak"
          value={currentUser.streak.toString()}
          color="text-[hsl(var(--gold))]"
          bgColor="bg-[hsl(var(--gold))]/10"
        />
        <StatCard
          icon={Trophy}
          label="Global Rank"
          value={`#${currentUser.rank}`}
          color="text-primary"
          bgColor="bg-primary/10"
        />
        <StatCard
          icon={Target}
          label="Level"
          value={currentUser.level.toString()}
          color="text-[hsl(var(--gold))]"
          bgColor="bg-[hsl(var(--gold))]/10"
        />
      </div>

      {/* Level progress */}
      <div className="rounded-xl border border-border bg-card p-5 mb-8">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground">Level {currentUser.level}</span>
          </div>
          <span className="text-xs text-muted-foreground">
            {currentUser.xp.toLocaleString()} / {currentUser.xpToNext.toLocaleString()} XP
          </span>
        </div>
        <Progress
          value={(currentUser.xp / currentUser.xpToNext) * 100}
          className="h-2.5 bg-secondary [&>div]:bg-gradient-to-r [&>div]:from-primary [&>div]:to-[hsl(var(--gold))]"
        />
        <p className="text-xs text-muted-foreground mt-2">
          {(currentUser.xpToNext - currentUser.xp).toLocaleString()} XP until Level {currentUser.level + 1}
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main content - 2 cols */}
        <div className="lg:col-span-2 space-y-8">
          {/* Current courses */}
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-4">Continue Learning</h2>
            <div className="space-y-3">
              {inProgressCourses.map((course) => {
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
                        href={`/courses/${course.slug}/lessons/${nextLesson?.id || "1-1"}`}
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
            <h2 className="text-lg font-semibold text-foreground mb-4">Activity Streak</h2>
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center gap-3 mb-4">
                <Flame className="h-5 w-5 text-[hsl(var(--gold))] animate-fire" />
                <span className="text-sm font-semibold text-foreground">
                  {currentUser.streak} day streak!
                </span>
              </div>
              <div className="grid grid-cols-7 gap-1.5">
                {streakDays.map((day) => (
                  <div
                    key={day.date}
                    className={`aspect-square rounded-sm transition-colors ${
                      day.intensity === 0
                        ? "bg-secondary"
                        : day.intensity === 1
                        ? "bg-primary/30"
                        : day.intensity === 2
                        ? "bg-primary/60"
                        : "bg-primary"
                    }`}
                    title={`${day.date}: ${day.active ? "Active" : "Inactive"}`}
                  />
                ))}
              </div>
              <div className="flex items-center justify-end gap-2 mt-3">
                <span className="text-[10px] text-muted-foreground">Less</span>
                <div className="flex gap-1">
                  <div className="h-3 w-3 rounded-sm bg-secondary" />
                  <div className="h-3 w-3 rounded-sm bg-primary/30" />
                  <div className="h-3 w-3 rounded-sm bg-primary/60" />
                  <div className="h-3 w-3 rounded-sm bg-primary" />
                </div>
                <span className="text-[10px] text-muted-foreground">More</span>
              </div>
            </div>
          </section>

          {/* Recommended courses */}
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-4">Recommended for You</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {recommendedCourses.map((course) => (
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
          {/* Badges */}
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-4">Achievements</h2>
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="grid grid-cols-4 gap-3">
                {currentUser.badges.map((badge) => {
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
                          className={`h-4 w-4 ${badge.earned ? "text-primary" : "text-muted-foreground"}`}
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
            <h2 className="text-lg font-semibold text-foreground mb-4">Recent Activity</h2>
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
                      <p className="text-sm text-foreground">{activity.text}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {activity.course && (
                          <span className="text-xs text-muted-foreground truncate">
                            {activity.course}
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground">{activity.time}</span>
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
      <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${bgColor} mb-3`}>
        <Icon className={`h-4 w-4 ${color}`} />
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </div>
  )
}
