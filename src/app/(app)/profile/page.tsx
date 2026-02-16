'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Zap,
  Flame,
  Trophy,
  Award,
  Shield,
  Calendar,
  ExternalLink,
  Github,
  Twitter,
  Globe,
  Settings,
  BookOpen,
  Target,
  Star,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useUserStore } from '@/stores/user-store';
import {
  MOCK_COURSES,
  MOCK_PROGRESS,
  MOCK_GAMIFICATION_PROFILE,
} from '@/services/mock-data';
import { TRACK_INFO, XP_CONFIG, getLevelTitle, DIFFICULTY_CONFIG } from '@/config/constants';

const ALL_ACHIEVEMENTS = [
  { id: 'first_lesson', name: 'First Steps', description: 'Complete your first lesson', icon: '👣', category: 'progress', rarity: 'common', unlocked: true },
  { id: 'week_warrior', name: 'Week Warrior', description: '7-day streak', icon: '🔥', category: 'streak', rarity: 'common', unlocked: true },
  { id: 'rust_rookie', name: 'Rust Rookie', description: 'First Rust lesson', icon: '🦀', category: 'skill', rarity: 'common', unlocked: true },
  { id: 'early_adopter', name: 'Early Adopter', description: 'Beta participant', icon: '🌅', category: 'special', rarity: 'legendary', unlocked: false },
  { id: 'first_course', name: 'Course Completer', description: 'Complete a course', icon: '📜', category: 'progress', rarity: 'rare', unlocked: false },
  { id: 'perfect_score', name: 'Perfect Score', description: 'First try success', icon: '💎', category: 'special', rarity: 'epic', unlocked: false },
  { id: 'monthly_master', name: 'Monthly Master', description: '30-day streak', icon: '🌟', category: 'streak', rarity: 'rare', unlocked: false },
  { id: 'anchor_expert', name: 'Anchor Expert', description: 'All Anchor courses', icon: '⚓', category: 'skill', rarity: 'epic', unlocked: false },
  { id: 'consistency_king', name: 'Consistency King', description: '100-day streak', icon: '👑', category: 'streak', rarity: 'legendary', unlocked: false },
  { id: 'fullstack_solana', name: 'Full Stack', description: 'All track courses', icon: '🚀', category: 'skill', rarity: 'legendary', unlocked: false },
  { id: 'bug_hunter', name: 'Bug Hunter', description: 'Report a verified bug', icon: '🐛', category: 'special', rarity: 'rare', unlocked: false },
  { id: 'speed_runner', name: 'Speed Runner', description: 'Course in 24h', icon: '⚡', category: 'progress', rarity: 'epic', unlocked: false },
];

const rarityColors = {
  common: '#888',
  rare: '#00D1FF',
  epic: '#9945FF',
  legendary: '#F0B90B',
};

export default function ProfilePage() {
  const { user, isAuthenticated, xp, level, profile, initDemoUser } =
    useUserStore();

  const effectiveProfile = profile || MOCK_GAMIFICATION_PROFILE;
  const effectiveXP = xp || effectiveProfile.xp;
  const effectiveLevel = level || effectiveProfile.level;
  const levelProgress = XP_CONFIG.levelProgress(effectiveXP);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-2">View Your Profile</h2>
            <p className="text-muted-foreground mb-6">
              Sign in to see your achievements, credentials, and quest progress.
            </p>
            <Button onClick={initDemoUser} className="gap-2 bg-gradient-to-r from-[#9945FF] to-[#14F195] text-white hover:opacity-90 border-0">
              Try Demo Mode
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Profile Header */}
      <section className="border-b border-border/40">
        <div
          className="h-32 relative"
          style={{
            background: 'linear-gradient(135deg, rgba(153, 69, 255, 0.2), rgba(20, 241, 149, 0.1), rgba(0, 209, 255, 0.1))',
          }}
        />
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 -mt-12 pb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
            <Avatar className="h-24 w-24 border-4 border-background">
              <AvatarFallback className="bg-gradient-to-br from-[#9945FF] to-[#14F195] text-white text-3xl font-bold">
                {user?.displayName?.charAt(0) || 'Q'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-bold">
                  {user?.displayName || 'Quest Hero'}
                </h1>
                <Badge
                  variant="outline"
                  className="border-quest-gold/30 text-quest-gold"
                >
                  {getLevelTitle(effectiveLevel)}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {user?.bio || 'A brave developer on the path to Solana mastery.'}
              </p>
              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Joined {user?.joinedAt || 'Jan 2026'}
                </span>
                <span className="flex items-center gap-1">
                  <Zap className="h-3 w-3 text-quest-gold" />
                  {effectiveXP.toLocaleString()} XP
                </span>
                <span className="flex items-center gap-1">
                  <Flame className="h-3 w-3 text-orange-500" />
                  {effectiveProfile.streak.currentStreak} day streak
                </span>
              </div>
            </div>
            <Link href="/settings">
              <Button variant="outline" size="sm" className="gap-2">
                <Settings className="h-4 w-4" />
                Edit Profile
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="overview">
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
            <TabsTrigger value="credentials">Credentials</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Level Progress */}
              <Card className="border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Star className="h-4 w-4 text-quest-gold" />
                    Level Progress
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center mb-4">
                    <p className="text-5xl font-bold">{effectiveLevel}</p>
                    <p className="text-sm text-muted-foreground">
                      {getLevelTitle(effectiveLevel)}
                    </p>
                  </div>
                  <div className="h-3 rounded-full bg-muted overflow-hidden mb-2">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-[#9945FF] to-[#14F195]"
                      initial={{ width: 0 }}
                      animate={{ width: `${levelProgress}%` }}
                      transition={{ duration: 1 }}
                    />
                  </div>
                  <p className="text-xs text-center text-muted-foreground">
                    {levelProgress}% to Level {effectiveLevel + 1}
                  </p>
                </CardContent>
              </Card>

              {/* Skills Radar */}
              <Card className="border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Target className="h-4 w-4 text-quest-cyan" />
                    Skill Tree
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {effectiveProfile.skills.map((skill) => {
                      const info = TRACK_INFO[skill.track];
                      const prog =
                        skill.xpRequired > 0
                          ? Math.round((skill.xp / skill.xpRequired) * 100)
                          : 0;
                      return (
                        <div
                          key={skill.id}
                          className={`${!skill.isUnlocked ? 'opacity-40' : ''}`}
                        >
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="flex items-center gap-1.5">
                              <span className="text-xs">{info.icon}</span>
                              <span className="font-medium">{skill.name}</span>
                            </span>
                            <span className="text-xs" style={{ color: info.color }}>
                              Lv.{skill.level}/{skill.maxLevel}
                            </span>
                          </div>
                          <div className="h-2 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${prog}%`,
                                backgroundColor: info.color,
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Completed Courses */}
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Quest Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(MOCK_PROGRESS).map(([courseId, progress]) => {
                    const course = MOCK_COURSES.find((c) => c.id === courseId);
                    if (!course) return null;
                    const trackInfo = TRACK_INFO[course.track];
                    return (
                      <Link key={courseId} href={`/courses/${course.slug}`}>
                        <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                          <span className="text-xl">{trackInfo.icon}</span>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{course.title}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Progress
                                value={progress.completionPercentage}
                                className="h-1.5 flex-1"
                              />
                              <span className="text-xs text-muted-foreground">
                                {progress.completionPercentage}%
                              </span>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-xs gap-1">
                            <Zap className="h-3 w-3 text-quest-gold" />
                            {progress.xpEarned}
                          </Badge>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="achievements">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {ALL_ACHIEVEMENTS.map((achievement) => {
                const color = rarityColors[achievement.rarity as keyof typeof rarityColors];
                return (
                  <motion.div
                    key={achievement.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <Card
                      className={`border-border/50 ${
                        !achievement.unlocked ? 'opacity-40' : ''
                      }`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div
                            className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl flex-shrink-0"
                            style={{
                              backgroundColor: `${color}10`,
                              border: `1px solid ${color}30`,
                            }}
                          >
                            {achievement.unlocked ? achievement.icon : '🔒'}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-sm">
                                {achievement.name}
                              </p>
                              <Badge
                                variant="outline"
                                className="text-[10px]"
                                style={{
                                  color,
                                  borderColor: `${color}30`,
                                }}
                              >
                                {achievement.rarity}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {achievement.description}
                            </p>
                            {achievement.unlocked && (
                              <p className="text-xs text-quest-health mt-1 flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3" />
                                Unlocked
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="credentials">
            <div className="grid sm:grid-cols-2 gap-6">
              {/* Mock Credential */}
              <Card className="border-border/50 glow-purple">
                <CardContent className="p-6 text-center">
                  <div className="w-32 h-32 mx-auto rounded-xl bg-gradient-to-br from-[#9945FF]/20 to-[#14F195]/20 border border-[#9945FF]/30 flex items-center justify-center mb-4">
                    <span className="text-5xl">⚡</span>
                  </div>
                  <h3 className="font-bold mb-1">Solana Fundamentals</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Track Level 3 &bull; 1,500 XP
                  </p>
                  <Badge
                    variant="outline"
                    className="text-xs text-quest-health border-quest-health/30"
                  >
                    Verified On-Chain
                  </Badge>
                  <div className="mt-4 pt-4 border-t border-border/50">
                    <a
                      href="https://explorer.solana.com?cluster=devnet"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline flex items-center justify-center gap-1"
                    >
                      View on Solana Explorer
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </CardContent>
              </Card>

              {/* Locked credential */}
              <Card className="border-border/50 border-dashed opacity-50">
                <CardContent className="p-6 text-center">
                  <div className="w-32 h-32 mx-auto rounded-xl bg-muted/30 border border-dashed border-border flex items-center justify-center mb-4">
                    <span className="text-4xl">🔒</span>
                  </div>
                  <h3 className="font-bold mb-1">Rust Mastery</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Complete the Rust track to earn this credential
                  </p>
                  <Badge variant="outline" className="text-xs">
                    Locked
                  </Badge>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
