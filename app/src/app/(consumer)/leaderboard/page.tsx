import { getLeaderboard, LeaderboardEntry } from "@/services/xp"
import { getCurrentUser } from "@/lib/current-user"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Trophy, Star, Flame, Zap, Medal } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default async function LeaderboardPage() {
  const [user, allTime, weekly, monthly] = await Promise.all([
    getCurrentUser(),
    getLeaderboard("all", 100),
    getLeaderboard("week", 50),
    getLeaderboard("month", 50),
  ])

  const currentUserRank = user
    ? allTime.findIndex((e) => e.userId === user.id || e.walletAddress === user.walletAddress) + 1
    : null

  function getRankDisplay(rank: number) {
    if (rank === 1) return { icon: "🥇", color: "text-yellow-400" }
    if (rank === 2) return { icon: "🥈", color: "text-slate-400" }
    if (rank === 3) return { icon: "🥉", color: "text-amber-600" }
    return { icon: `#${rank}`, color: "text-muted-foreground" }
  }

  function getDisplayName(entry: LeaderboardEntry) {
    const isCurrentUser =
      user?.id === entry.userId || (Boolean(user?.walletAddress) && user?.walletAddress === entry.walletAddress)

    if (isCurrentUser && user?.name?.trim()) return user.name
    if (entry.name?.trim()) return entry.name
    if (entry.username?.trim()) return `@${entry.username}`
    if (entry.walletAddress) return `${entry.walletAddress.slice(0, 4)}...${entry.walletAddress.slice(-4)}`
    return "Anonymous"
  }

  function LeaderboardList({ entries }: { entries: LeaderboardEntry[] }) {
    if (entries.length === 0) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No entries yet. Start learning to appear here!</p>
        </div>
      )
    }

    return (
      <>
        {/* Top 3 Podium */}
        {entries.length >= 3 && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[entries[1]!, entries[0]!, entries[2]!].map((entry, podiumIndex) => {
              const isFirst = entry.rank === 1
              const displayName = getDisplayName(entry)
              return (
                <div
                  key={entry.userId}
                  className={`flex flex-col items-center p-4 rounded-xl border transition-all ${
                    isFirst
                      ? "bg-yellow-500/10 border-yellow-500/30 -mt-4 pb-8"
                      : "bg-card border-border"
                  }`}
                >
                  <span className="text-2xl mb-2">{["🥈", "🥇", "🥉"][podiumIndex]}</span>
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold mb-2"
                    style={{ backgroundColor: "#9945FF", color: "white" }}
                  >
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                  <p className="text-xs font-semibold text-center line-clamp-1">{displayName}</p>
                  <p className="text-xs text-muted-foreground">{entry.xp.toLocaleString()} XP</p>
                  <Badge variant="outline" className="mt-1 text-xs">Lv.{entry.level}</Badge>
                </div>
              )
            })}
          </div>
        )}

        {/* Full List */}
        <div className="space-y-2">
          {entries.map((entry) => {
            const { icon, color } = getRankDisplay(entry.rank)
            const isCurrentUser =
              user?.id === entry.userId || (Boolean(user?.walletAddress) && user?.walletAddress === entry.walletAddress)
            const displayName = getDisplayName(entry)

            return (
              <Link
                key={entry.userId}
                href={entry.username ? `/profile/${entry.username}` : "#"}
              >
                <div
                  className={`flex items-center gap-4 p-4 rounded-xl border transition-all hover:border-primary/30 ${
                    isCurrentUser
                      ? "bg-primary/10 border-primary/30"
                      : "bg-card border-border hover:bg-card/80"
                  }`}
                >
                  <div className={`w-8 text-center font-bold text-sm ${color} flex-shrink-0`}>
                    {icon}
                  </div>

                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
                    style={{
                      backgroundColor: "rgba(153, 69, 255, 0.1)",
                      border: "1px solid rgba(153, 69, 255, 0.2)",
                    }}
                  >
                    {entry.image ? (
                      <Image
                        src={entry.image}
                        alt=""
                        width={40}
                        height={40}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-foreground">{displayName.charAt(0).toUpperCase()}</span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">
                      {displayName}
                      {isCurrentUser && (
                        <span className="ml-2 text-xs text-primary">(you)</span>
                      )}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-primary" />
                        Level {entry.level}
                      </span>
                      {entry.streak > 0 && (
                        <span className="flex items-center gap-1">
                          <Flame className="w-3 h-3 text-orange-400" />
                          {entry.streak}d
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <div className="flex items-center gap-1 justify-end">
                      <Zap className="w-3.5 h-3.5 text-primary" />
                      <span className="font-bold text-sm">{entry.xp.toLocaleString()}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">XP</span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </>
    )
  }

  function EmptyTimeframe({ label }: { label: string }) {
    return (
      <div className="text-center py-12 text-muted-foreground bg-card border border-dashed border-border rounded-xl">
        <Medal className="w-10 h-10 mx-auto mb-3 opacity-40" />
        <p className="font-medium">No activity {label} yet</p>
        <p className="text-sm mt-1">Complete lessons to earn XP and appear here</p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary mb-4 mt-10">
          <Trophy className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-3xl font-bold mb-2">Leaderboard</h1>
        <p className="text-muted-foreground">
          Top builders ranked by XP earned on the platform
        </p>
        {currentUserRank != null && currentUserRank > 0 && (
          <div className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
            <Star className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Your rank: #{currentUserRank}</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all">
        <TabsList className="grid grid-cols-3 w-full bg-card border border-border">
          <TabsTrigger value="weekly">This Week</TabsTrigger>
          <TabsTrigger value="monthly">This Month</TabsTrigger>
          <TabsTrigger value="all">All Time</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6 space-y-2">
          <LeaderboardList entries={allTime} />
        </TabsContent>

        <TabsContent value="weekly" className="mt-6 space-y-2">
          {weekly.length === 0
            ? <EmptyTimeframe label="this week" />
            : <LeaderboardList entries={weekly} />}
        </TabsContent>

        <TabsContent value="monthly" className="mt-6 space-y-2">
          {monthly.length === 0
            ? <EmptyTimeframe label="this month" />
            : <LeaderboardList entries={monthly} />}
        </TabsContent>
      </Tabs>
    </div>
  )
}
