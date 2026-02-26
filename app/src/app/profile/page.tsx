"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  User,
  Twitter,
  Github,
  Globe,
  Copy,
  CheckCircle2,
  ExternalLink,
  Zap,
  Trophy,
  BookOpen,
  Flame,
  Shield,
  Calendar,
  Award,
  Share2,
} from "lucide-react";
import { PageLayout } from "@/components/layout/page-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AchievementBadge } from "@/components/gamification/achievement-badge";
import { XPDisplay } from "@/components/gamification/xp-display";
import { learningProgressService } from "@/lib/services/learning-progress";
import { MOCK_COURSES, MOCK_ACHIEVEMENTS, generateMockStreak } from "@/lib/mock-data";
import { calculateXPBalance, formatXP, getLevelColor, getLevelName } from "@/lib/utils/xp";
import { Credential, Achievement } from "@/types";
import { cn } from "@/lib/utils/cn";
import { toast } from "sonner";

// Radar chart skill data
const SKILLS = [
  { label: "Rust", value: 72 },
  { label: "Anchor", value: 58 },
  { label: "Frontend", value: 85 },
  { label: "Security", value: 45 },
  { label: "DeFi", value: 38 },
  { label: "NFT/Token", value: 65 },
];

export default function ProfilePage() {
  const { publicKey } = useWallet();
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [copied, setCopied] = useState(false);
  const [xpBalance] = useState(calculateXPBalance(4200));
  const [streak] = useState(generateMockStreak());

  useEffect(() => {
    const walletAddr = publicKey?.toBase58() ?? "demo";
    learningProgressService.getCredentials(walletAddr).then(setCredentials);
    learningProgressService.getAchievements(walletAddr).then(setAchievements);
  }, [publicKey]);

  const copyAddress = () => {
    if (publicKey) {
      navigator.clipboard.writeText(publicKey.toBase58());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Address copied!");
    }
  };

  const walletShort = publicKey
    ? `${publicKey.toBase58().slice(0, 8)}...${publicKey.toBase58().slice(-8)}`
    : "Demo Wallet";
  const levelColor = getLevelColor(xpBalance.level);
  const levelName = getLevelName(xpBalance.level);
  const unlockedAchievements = achievements.filter((a) => a.isUnlocked);

  return (
    <PageLayout>
      <div className="min-h-screen pt-16">
        {/* Profile hero */}
        <div className="relative py-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
          <div className="absolute inset-0 bg-grid opacity-20" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#9945FF]/5 to-transparent" />

          <div className="max-w-4xl mx-auto relative z-10">
            <div className="flex flex-col sm:flex-row items-start gap-6">
              {/* Avatar */}
              <motion.div
                initial={{ scale: 0.9, opacity: 1 }}
                animate={{ scale: 1, opacity: 1 }}
                className="relative"
              >
                <div
                  className="w-24 h-24 rounded-2xl flex items-center justify-center text-4xl font-bold text-white shadow-lg"
                  style={{
                    background: `linear-gradient(135deg, #9945FF, #14F195)`,
                    boxShadow: `0 0 30px ${levelColor}30`,
                  }}
                >
                  {publicKey ? publicKey.toBase58().slice(0, 1).toUpperCase() : "S"}
                </div>
                <div
                  className="absolute -bottom-2 -right-2 w-8 h-8 rounded-lg border-2 border-background flex items-center justify-center text-sm font-bold"
                  style={{ backgroundColor: levelColor, color: "#000" }}
                >
                  {xpBalance.level}
                </div>
              </motion.div>

              {/* Info */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl font-bold">Solana Builder</h1>
                  <Badge
                    className="text-xs font-bold border"
                    style={{
                      backgroundColor: `${levelColor}20`,
                      borderColor: `${levelColor}40`,
                      color: levelColor,
                    }}
                  >
                    {levelName}
                  </Badge>
                </div>

                <button
                  onClick={copyAddress}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4 font-mono"
                >
                  {walletShort}
                  {copied ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#14F195]" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>

                <div className="flex flex-wrap gap-4 text-sm">
                  {[
                    { icon: Zap, value: formatXP(xpBalance.amount), label: "XP", color: "#9945FF" },
                    { icon: BookOpen, value: "2", label: "Courses", color: "#14F195" },
                    { icon: Flame, value: streak.currentStreak, label: "Streak", color: "#FF6B35" },
                    { icon: Trophy, value: unlockedAchievements.length, label: "Achievements", color: "#00C2FF" },
                  ].map(({ icon: Icon, value, label, color }) => (
                    <div key={label} className="flex items-center gap-1.5">
                      <Icon className="h-4 w-4" style={{ color }} />
                      <strong>{value}</strong>
                      <span className="text-muted-foreground">{label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button asChild variant="glass" size="sm">
                  <Link href="/settings">
                    <User className="h-4 w-4" />
                    Edit
                  </Link>
                </Button>
                <Button variant="glass" size="sm">
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="bg-white/5 border border-white/10">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="achievements">Achievements</TabsTrigger>
              <TabsTrigger value="credentials">Credentials</TabsTrigger>
              <TabsTrigger value="courses">Courses</TabsTrigger>
            </TabsList>

            {/* Overview tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-6">
                <XPDisplay xpBalance={xpBalance} />

                {/* Skills */}
                <div className="glass-card p-5">
                  <h3 className="font-semibold text-sm mb-4">Skill Progress</h3>
                  <div className="space-y-3">
                    {SKILLS.map((skill) => (
                      <div key={skill.label}>
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="font-medium">{skill.label}</span>
                          <span className="text-muted-foreground">{skill.value}%</span>
                        </div>
                        <Progress value={skill.value} variant="xp" className="h-1.5" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recent achievements */}
              <div className="glass-card p-5">
                <h3 className="font-semibold text-sm mb-4">Recent Achievements</h3>
                <div className="flex flex-wrap gap-4">
                  {unlockedAchievements.slice(0, 6).map((a) => (
                    <AchievementBadge key={a.id} achievement={a} showDetails />
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Achievements tab */}
            <TabsContent value="achievements">
              <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-semibold">
                    {unlockedAchievements.length}/{achievements.length} Unlocked
                  </h2>
                  <Progress
                    value={(unlockedAchievements.length / achievements.length) * 100}
                    variant="xp"
                    className="w-32"
                  />
                </div>

                {["progress", "streak", "skill", "community", "special"].map((category) => {
                  const cats = achievements.filter((a) => a.category === category);
                  if (!cats.length) return null;
                  return (
                    <div key={category} className="mb-8">
                      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 capitalize">
                        {category}
                      </h3>
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
                        {cats.map((a) => (
                          <AchievementBadge key={a.id} achievement={a} size="lg" showDetails />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </TabsContent>

            {/* Credentials tab */}
            <TabsContent value="credentials">
              {credentials.length > 0 ? (
                <div className="grid sm:grid-cols-2 gap-6">
                  {credentials.map((cred) => (
                    <CredentialCard key={cred.id} credential={cred} />
                  ))}
                </div>
              ) : (
                <div className="glass-card p-12 text-center">
                  <div className="text-4xl mb-4">🎓</div>
                  <h3 className="font-semibold mb-2">No credentials yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Complete a course to earn your first on-chain NFT credential.
                  </p>
                  <Button asChild variant="gradient">
                    <Link href="/courses">Explore Courses</Link>
                  </Button>
                </div>
              )}
            </TabsContent>

            {/* Courses tab */}
            <TabsContent value="courses">
              <div className="space-y-4">
                {MOCK_COURSES.slice(0, 2).map((course) => (
                  <div key={course.id} className="glass-card p-4 flex items-center gap-4">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
                      style={{ backgroundColor: `${course.track.color}15` }}
                    >
                      {course.track.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm">{course.title}</h3>
                      <div className="flex items-center gap-3 mt-1">
                        <Progress value={30} variant="xp" className="w-24 h-1" />
                        <span className="text-xs text-muted-foreground">30%</span>
                        <Badge variant="intermediate" className="text-xs">In Progress</Badge>
                      </div>
                    </div>
                    <Button asChild variant="glass" size="sm">
                      <Link href={`/courses/${course.slug}`}>
                        Continue
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </PageLayout>
  );
}

function CredentialCard({ credential }: { credential: Credential }) {
  return (
    <div className="glass-card p-5 relative overflow-hidden group hover:border-[#9945FF]/30 transition-all duration-300">
      <div className="absolute inset-0 bg-gradient-to-br from-[#9945FF]/5 to-[#14F195]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl"
            style={{ backgroundColor: `${credential.track.color}15` }}
          >
            {credential.track.icon}
          </div>
          <Badge variant="purple" className="text-xs">
            <Shield className="h-3 w-3 mr-1" />
            Soulbound NFT
          </Badge>
        </div>

        <h3 className="font-bold text-base mb-1">{credential.name}</h3>
        <p className="text-sm text-muted-foreground mb-4">{credential.track.name}</p>

        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { label: "Level", value: credential.level },
            { label: "Courses", value: credential.coursesCompleted },
            { label: "Total XP", value: formatXP(credential.totalXp) },
          ].map(({ label, value }) => (
            <div key={label} className="text-center p-2 rounded-lg bg-white/5">
              <p className="text-sm font-bold">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Button
            asChild
            variant="glass"
            size="sm"
            className="flex-1 text-xs"
          >
            <Link
              href={`https://explorer.solana.com/address/${credential.mintAddress}?cluster=devnet`}
              target="_blank"
            >
              <ExternalLink className="h-3 w-3" />
              Verify On-Chain
            </Link>
          </Button>
          <Button asChild variant="glass" size="sm" className="text-xs">
            <Link href={`/certificates/${credential.id}`}>View</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
