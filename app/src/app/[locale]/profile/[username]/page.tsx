"use client";

import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Calendar, Github, Twitter, ExternalLink, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { LevelBadge } from "@/components/gamification/level-badge";
import { AchievementCard } from "@/components/gamification/achievement-card";

const MOCK_ACHIEVEMENTS = [
  { name: "First Course", description: "Complete your first course", rarity: "common" as const, xpReward: 100, earned: true, earnedDate: "2025-12-15" },
  { name: "Speed Runner", description: "Complete a course in under 24 hours", rarity: "rare" as const, xpReward: 250, earned: true, earnedDate: "2026-01-20" },
  { name: "DeFi Expert", description: "Complete all DeFi track courses", rarity: "epic" as const, xpReward: 500, earned: false },
];

export default function ProfilePage() {
  const params = useParams();
  const username = params.username as string;
  const t = useTranslations("profile");

  // Mock profile data
  const profile = {
    username,
    displayName: username.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    bio: "Solana developer learning on-chain. Building the future of decentralized education.",
    avatarUrl: null,
    level: 12,
    xp: 4800,
    coursesCompleted: 5,
    credentials: 3,
    joinDate: "2025-10-01",
    github: "solanadev",
    twitter: "solanadev",
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Profile Header */}
      <div className="rounded-2xl gradient-bg p-8">
        <div className="flex flex-col sm:flex-row items-start gap-6">
          <Avatar className="h-20 w-20">
            <AvatarImage src={profile.avatarUrl || undefined} />
            <AvatarFallback className="text-2xl">
              {profile.displayName.charAt(0)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold">{profile.displayName}</h1>
              <LevelBadge level={profile.level} size="sm" />
            </div>
            <p className="text-sm text-muted-foreground mb-3">@{profile.username}</p>
            <p className="text-sm text-muted-foreground max-w-lg">{profile.bio}</p>

            <div className="flex items-center gap-4 mt-4">
              {profile.github && (
                <a
                  href={`https://github.com/${profile.github}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Github className="h-4 w-4" />
                </a>
              )}
              {profile.twitter && (
                <a
                  href={`https://twitter.com/${profile.twitter}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Twitter className="h-4 w-4" />
                </a>
              )}
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                Joined {new Date(profile.joinDate).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: t("totalXp"), value: profile.xp.toLocaleString(), icon: "⚡" },
          { label: t("level"), value: profile.level, icon: "🎯" },
          { label: t("coursesCompleted"), value: profile.coursesCompleted, icon: "📚" },
          { label: t("credentials"), value: profile.credentials, icon: "🏅" },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4 text-center">
              <div className="text-2xl mb-1">{stat.icon}</div>
              <div className="text-xl font-bold">{stat.value}</div>
              <div className="text-xs text-muted-foreground">{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Achievements */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t("achievements")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {MOCK_ACHIEVEMENTS.map((a) => (
            <AchievementCard key={a.name} {...a} />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
