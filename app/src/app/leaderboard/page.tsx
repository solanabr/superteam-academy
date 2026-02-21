'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Navigation } from '@/components/navigation'
import { useAuth } from '@/providers/auth-provider'
import { learningProgressService } from '@/services/learning-progress.service'
import type { LeaderboardEntry } from '@/types'
import {
  Trophy,
  Medal,
  Award,
  Crown,
  Zap,
  TrendingUp,
  Users,
  Calendar,
  BarChart3
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatXP, calculateLevel } from '@/lib/utils'

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 }
}

const stagger = {
  animate: {
    transition: {
      staggerChildren: 0.05
    }
  }
}

interface LeaderboardStats {
  totalUsers: number
  averageXP: number
  topPerformer: string
  totalXPAwarded: number
}

export default function LeaderboardPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'alltime' | 'monthly' | 'weekly'>('alltime')
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [userRank, setUserRank] = useState<LeaderboardEntry | null>(null)
  const [stats, setStats] = useState<LeaderboardStats>({
    totalUsers: 0,
    averageXP: 0,
    topPerformer: '',
    totalXPAwarded: 0
  })

  useEffect(() => {
    loadLeaderboard(activeTab)
  }, [activeTab])

  const loadLeaderboard = async (timeframe: 'weekly' | 'monthly' | 'alltime') => {
    setLoading(true)
    try {
      const leaderboardData = await learningProgressService.getLeaderboard(timeframe)
      setLeaderboard(leaderboardData)

      // Find user's rank if signed in
      if (user) {
        const userEntry = leaderboardData.find(entry => entry.userId === user.id)
        setUserRank(userEntry || null)
      }

      // Calculate stats
      const totalUsers = leaderboardData.length
      const totalXP = leaderboardData.reduce((sum, entry) => sum + entry.xp, 0)
      const averageXP = totalUsers > 0 ? Math.round(totalXP / totalUsers) : 0
      const topPerformer = leaderboardData[0]?.displayName || 'No data'

      setStats({
        totalUsers,
        averageXP,
        topPerformer,
        totalXPAwarded: totalXP
      })
    } catch (error) {
      console.error('Failed to load leaderboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-5 w-5 text-yellow-500" />
      case 2:
        return <Trophy className="h-5 w-5 text-gray-400" />
      case 3:
        return <Medal className="h-5 w-5 text-orange-500" />
      default:
        return <div className="w-5 h-5 flex items-center justify-center text-sm font-bold text-muted-foreground">
          {rank}
        </div>
    }
  }

  const getRankBadgeColor = (rank: number) => {
    if (rank <= 3) return 'bg-gradient-solana text-white'
    if (rank <= 10) return 'bg-primary/10 text-primary border-primary/20'
    if (rank <= 50) return 'bg-blue-500/10 text-blue-600 border-blue-500/20'
    return 'bg-muted text-muted-foreground'
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container py-8">
        {/* Header */}
        <motion.div
          className="text-center mb-8"
          initial="initial"
          animate="animate"
          variants={fadeInUp}
        >
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl mb-2 flex items-center justify-center gap-3">
            <Trophy className="h-8 w-8 text-yellow-500" />
            Leaderboard
          </h1>
          <p className="text-lg text-muted-foreground">
            See how you rank against other Solana developers
          </p>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          initial="initial"
          animate="animate"
          variants={stagger}
        >
          <motion.div variants={fadeInUp}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={fadeInUp}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average XP</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatXP(stats.averageXP)}</div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={fadeInUp}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Top Performer</CardTitle>
                <Crown className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold truncate">{stats.topPerformer}</div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={fadeInUp}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total XP</CardTitle>
                <Zap className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatXP(stats.totalXPAwarded)}</div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Leaderboard */}
          <div className="lg:col-span-3">
            <motion.div
              initial="initial"
              animate="animate"
              variants={fadeInUp}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Rankings</CardTitle>
                  <CardDescription>
                    Top developers by experience points
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="weekly" className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Weekly
                      </TabsTrigger>
                      <TabsTrigger value="monthly" className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Monthly
                      </TabsTrigger>
                      <TabsTrigger value="alltime" className="flex items-center gap-2">
                        <Trophy className="h-4 w-4" />
                        All Time
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value={activeTab} className="mt-6">
                      {loading ? (
                        <div className="space-y-4">
                          {Array.from({ length: 10 }).map((_, i) => (
                            <div key={i} className="animate-pulse">
                              <div className="h-16 bg-muted rounded-lg" />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <motion.div
                          className="space-y-3"
                          initial="initial"
                          animate="animate"
                          variants={stagger}
                        >
                          {leaderboard.map((entry, index) => (
                            <motion.div
                              key={entry.userId}
                              variants={fadeInUp}
                              className={cn(
                                'flex items-center space-x-4 p-4 rounded-lg border transition-colors',
                                entry.userId === user?.id && 'bg-primary/5 border-primary/20',
                                index < 3 && 'bg-gradient-to-r from-primary/5 to-transparent'
                              )}
                            >
                              {/* Rank */}
                              <div className="flex items-center justify-center w-12">
                                {getRankIcon(entry.rank)}
                              </div>

                              {/* Avatar */}
                              <Avatar className={cn(
                                'h-12 w-12',
                                index < 3 && 'ring-2 ring-primary/20'
                              )}>
                                <AvatarImage src={entry.avatar} alt={entry.displayName} />
                                <AvatarFallback>
                                  {entry.displayName.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>

                              {/* User Info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2">
                                  <h3 className="font-semibold truncate">
                                    {entry.displayName}
                                  </h3>
                                  {entry.userId === user?.id && (
                                    <Badge variant="outline" className="text-xs">
                                      You
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  @{entry.username}
                                </p>
                              </div>

                              {/* Level */}
                              <div className="flex flex-col items-center">
                                <div className="level-indicator mb-1">
                                  {entry.level}
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  Level
                                </span>
                              </div>

                              {/* XP */}
                              <div className="flex flex-col items-end">
                                <div className="font-bold text-lg">
                                  {formatXP(entry.xp)}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  XP
                                </div>
                              </div>

                              {/* Rank Badge */}
                              <Badge
                                className={cn(
                                  'px-3 py-1 font-bold',
                                  getRankBadgeColor(entry.rank)
                                )}
                              >
                                #{entry.rank}
                              </Badge>
                            </motion.div>
                          ))}
                        </motion.div>
                      )}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Your Rank */}
            {userRank && (
              <motion.div
                initial="initial"
                animate="animate"
                variants={fadeInUp}
              >
                <Card className="bg-gradient-to-br from-primary/10 to-accent/10">
                  <CardHeader>
                    <CardTitle className="text-lg">Your Rank</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={userRank.avatar} alt={userRank.displayName} />
                        <AvatarFallback>
                          {userRank.displayName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold">{userRank.displayName}</h3>
                        <p className="text-sm text-muted-foreground">
                          @{userRank.username}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-primary">
                          #{userRank.rank}
                        </div>
                        <div className="text-xs text-muted-foreground">Rank</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold">
                          {formatXP(userRank.xp)}
                        </div>
                        <div className="text-xs text-muted-foreground">XP</div>
                      </div>
                    </div>

                    <div className="text-center">
                      <div className="level-indicator mx-auto mb-2">
                        {userRank.level}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Level {userRank.level}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Top 3 Spotlight */}
            <motion.div
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              variants={fadeInUp}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Top 3 Champions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {leaderboard.slice(0, 3).map((entry, index) => (
                      <div key={entry.userId} className="flex items-center space-x-3">
                        <div className={cn(
                          'w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm',
                          index === 0 && 'bg-yellow-500 text-white',
                          index === 1 && 'bg-gray-400 text-white',
                          index === 2 && 'bg-orange-500 text-white'
                        )}>
                          {index + 1}
                        </div>
                        
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={entry.avatar} alt={entry.displayName} />
                          <AvatarFallback className="text-xs">
                            {entry.displayName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {entry.displayName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatXP(entry.xp)} XP
                          </p>
                        </div>

                        <div className="level-indicator text-xs">
                          {entry.level}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Achievements Preview */}
            <motion.div
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              variants={fadeInUp}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Award className="h-5 w-5 text-purple-500" />
                    Recent Achievers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-center py-4 text-muted-foreground text-sm">
                      Recent achievement unlocks will appear here
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Call to Action */}
            {!user && (
              <motion.div
                initial="initial"
                whileInView="animate"
                viewport={{ once: true }}
                variants={fadeInUp}
              >
                <Card className="bg-gradient-solana text-white">
                  <CardHeader>
                    <CardTitle className="text-lg">Join the Competition!</CardTitle>
                    <CardDescription className="text-white/80">
                      Start learning and climb the leaderboard
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      variant="outline" 
                      className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20"
                    >
                      Sign Up Free
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}