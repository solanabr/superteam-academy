"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { learningProgressService } from "@/services/learning-progress";
import type { LeaderboardEntry } from "@/types/learning";
import { Award, ArrowLeft, BookOpen, Radar, Shield } from "lucide-react";
import { SocialIcon } from "@/components/social-icons";
import type { SocialPlatform } from "@/components/social-icons";
import { useAuth } from "@/hooks/use-auth";

const PROFILE_NAME_KEY = "st-academy:profile-name";
const PROFILE_AVATAR_KEY = "st-academy:profile-avatar";
const PROFILE_BIO_KEY = "st-academy:profile-bio";
const ACCOUNT_OPENED_KEY = "st-academy:account-opened";

const SOCIAL_PLATFORMS: {
  platform: SocialPlatform;
  key: string;
  placeholder: string;
}[] = [
  { platform: "x", key: "st-academy:social:x", placeholder: "X (Twitter)" },
  {
    platform: "linkedin",
    key: "st-academy:social:linkedin",
    placeholder: "LinkedIn",
  },
  {
    platform: "telegram",
    key: "st-academy:social:telegram",
    placeholder: "Telegram",
  },
  {
    platform: "discord",
    key: "st-academy:social:discord",
    placeholder: "Discord",
  },
  {
    platform: "github",
    key: "st-academy:social:github",
    placeholder: "GitHub",
  },
];

const SKILL_DATA: { key: string; level: number }[] = [
  { key: "rust", level: 70 },
  { key: "anchor", level: 45 },
  { key: "frontend", level: 80 },
  { key: "security", level: 30 },
  { key: "defi", level: 50 },
  { key: "testing", level: 60 },
];

interface StubProfile {
  bio: string;
  joinDate: string;
  socialLinks: Partial<Record<SocialPlatform, string>>;
}

const STUB_PROFILES: Record<string, StubProfile> = {
  u1: {
    bio: "Solana builder and open-source contributor. Passionate about DeFi and on-chain programs.",
    joinDate: "2024-06-15T00:00:00Z",
    socialLinks: {
      x: "https://x.com/builder1",
      github: "https://github.com/builder1",
      discord: "https://discord.gg",
    },
  },
  u2: {
    bio: "Full stack developer exploring the Solana ecosystem. Love building dApps.",
    joinDate: "2024-08-20T00:00:00Z",
    socialLinks: {
      x: "https://x.com/solanadev",
      linkedin: "https://linkedin.com",
      telegram: "https://t.me",
    },
  },
  u3: {
    bio: "Rust enthusiast and Solana program developer. Focused on security and performance.",
    joinDate: "2024-09-10T00:00:00Z",
    socialLinks: {
      x: "https://x.com/rustfan",
      github: "https://github.com/rustfan",
    },
  },
  u4: {
    bio: "Anchor framework specialist. Building the future of on-chain applications.",
    joinDate: "2024-10-05T00:00:00Z",
    socialLinks: {
      x: "https://x.com/anchorpro",
      discord: "https://discord.gg",
      github: "https://github.com",
    },
  },
  u6: {
    bio: "Token economics and SPL token expert. Exploring Token-2022 extensions.",
    joinDate: "2024-11-12T00:00:00Z",
    socialLinks: { x: "https://x.com/tokenmaster", telegram: "https://t.me" },
  },
  u7: {
    bio: "DeFi protocol researcher and developer. Auditing smart contracts.",
    joinDate: "2025-01-08T00:00:00Z",
    socialLinks: {
      x: "https://x.com/defihacker",
      linkedin: "https://linkedin.com",
    },
  },
  u8: {
    bio: "Web3 developer transitioning from Ethereum to Solana. Learning Rust.",
    joinDate: "2025-01-20T00:00:00Z",
    socialLinks: {
      github: "https://github.com/cryptonova",
      discord: "https://discord.gg",
    },
  },
  u9: {
    bio: "Blockchain developer and educator. Creating tutorials for beginners.",
    joinDate: "2025-02-01T00:00:00Z",
    socialLinks: { x: "https://x.com/chaincoder" },
  },
  u10: {
    bio: "Just getting started with Solana development. Excited to learn!",
    joinDate: "2025-02-15T00:00:00Z",
    socialLinks: {},
  },
};

const STUB_ENTRIES: LeaderboardEntry[] = [
  {
    rank: 1,
    userId: "u1",
    username: "Builder1",
    avatarUrl: "https://i.pravatar.cc/80?img=1",
    xp: 5000,
    level: 7,
    streak: 12,
  },
  {
    rank: 2,
    userId: "u2",
    username: "SolanaDev",
    avatarUrl: "https://i.pravatar.cc/80?img=2",
    xp: 3200,
    level: 5,
    streak: 5,
  },
  {
    rank: 3,
    userId: "u3",
    username: "RustFan",
    avatarUrl: "https://i.pravatar.cc/80?img=3",
    xp: 2100,
    level: 4,
    streak: 3,
  },
  {
    rank: 4,
    userId: "u4",
    username: "AnchorPro",
    avatarUrl: "https://i.pravatar.cc/80?img=4",
    xp: 1800,
    level: 4,
    streak: 8,
  },
  {
    rank: 6,
    userId: "u6",
    username: "TokenMaster",
    avatarUrl: "https://i.pravatar.cc/80?img=6",
    xp: 1200,
    level: 3,
    streak: 2,
  },
  {
    rank: 7,
    userId: "u7",
    username: "DeFiHacker",
    avatarUrl: "https://i.pravatar.cc/80?img=7",
    xp: 900,
    level: 2,
    streak: 0,
  },
  {
    rank: 8,
    userId: "u8",
    username: "CryptoNova",
    avatarUrl: "https://i.pravatar.cc/80?img=8",
    xp: 750,
    level: 2,
    streak: 4,
  },
  {
    rank: 9,
    userId: "u9",
    username: "ChainCoder",
    avatarUrl: "https://i.pravatar.cc/80?img=9",
    xp: 500,
    level: 1,
    streak: 1,
  },
  {
    rank: 10,
    userId: "u10",
    username: "Web3Noob",
    avatarUrl: "https://i.pravatar.cc/80?img=10",
    xp: 250,
    level: 1,
    streak: 0,
  },
];

function formatJoinDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("default", { month: "long", year: "numeric" });
  } catch {
    return "";
  }
}

export function PublicProfileClient({ userId }: { userId: string }) {
  const t = useTranslations("profile");
  const tLeaderboard = useTranslations("leaderboard");
  const router = useRouter();
  const { connected } = useAuth();
  const [entry, setEntry] = useState<LeaderboardEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [bio, setBio] = useState("");
  const [joinDate, setJoinDate] = useState("");
  const [socialLinks, setSocialLinks] = useState<
    Partial<Record<SocialPlatform, string>>
  >({});
  const [isCurrentUser, setIsCurrentUser] = useState(false);

  useEffect(() => {
    const isCurrent = connected && userId === "current-user";
    setIsCurrentUser(isCurrent);

    // Load profile data
    if (isCurrent) {
      // Current user: load from localStorage
      const storedName = localStorage.getItem(PROFILE_NAME_KEY) || "";
      const storedAvatar = localStorage.getItem(PROFILE_AVATAR_KEY) || "";
      const storedBio = localStorage.getItem(PROFILE_BIO_KEY) || "";
      setBio(storedBio);

      let opened = localStorage.getItem(ACCOUNT_OPENED_KEY);
      if (!opened) {
        opened = new Date().toISOString();
        localStorage.setItem(ACCOUNT_OPENED_KEY, opened);
      }
      setJoinDate(formatJoinDate(opened));

      const links: Partial<Record<SocialPlatform, string>> = {};
      for (const s of SOCIAL_PLATFORMS) {
        const url = localStorage.getItem(s.key) || "";
        if (url) links[s.platform] = url;
      }
      setSocialLinks(links);

      // Build entry from localStorage
      setEntry({
        rank: 5,
        userId: "current-user",
        username: storedName || "You",
        avatarUrl: storedAvatar || null,
        xp: 1500,
        level: 3,
        streak: 6,
      });
      setLoading(false);
    } else {
      // Other user: load from leaderboard + stub profile
      learningProgressService.getLeaderboard("alltime").then((entries) => {
        const list = entries.length > 0 ? entries : STUB_ENTRIES;
        const found = list.find((e) => e.userId === userId);
        setEntry(found ?? null);

        const stubProfile = STUB_PROFILES[userId];
        if (stubProfile) {
          setBio(stubProfile.bio);
          setJoinDate(formatJoinDate(stubProfile.joinDate));
          setSocialLinks(stubProfile.socialLinks);
        }

        setLoading(false);
      });
    }
  }, [userId, connected]);

  if (loading) {
    return (
      <div className="container py-16 text-center">
        <div className="h-8 w-8 mx-auto animate-spin rounded-full border-4 border-muted border-t-[hsl(var(--brand-logo-green))]" />
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="container py-8">
        <p className="text-muted-foreground">Usuário não encontrado.</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.push("/leaderboard")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar ao ranking
        </Button>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <Button
        variant="ghost"
        size="sm"
        className="mb-6 gap-2"
        onClick={() => router.push("/leaderboard")}
      >
        <ArrowLeft className="h-4 w-4" />
        {tLeaderboard("title")}
      </Button>

      {/* Profile header */}
      <div className="mb-8 flex flex-col items-center gap-4 sm:flex-row sm:items-center">
        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full border-4 border-[#008c4C] bg-muted">
          {entry.avatarUrl ? (
            entry.avatarUrl.startsWith("data:") ? (
              <img
                src={entry.avatarUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <Image
                src={entry.avatarUrl}
                alt=""
                fill
                className="object-cover"
                sizes="96px"
                unoptimized
              />
            )
          ) : (
            <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-muted-foreground">
              {entry.username.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div className="text-center sm:text-left">
          <h1 className="text-2xl font-bold text-[hsl(var(--brand-logo-green))] drop-shadow-md">
            {entry.username}
          </h1>
          {joinDate && (
            <p className="text-muted-foreground">
              {t("joinDate")} {joinDate}
            </p>
          )}
          {bio && <p className="mt-2 text-sm text-muted-foreground">{bio}</p>}
          {/* Social icons */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {SOCIAL_PLATFORMS.map((s) => {
              const url = socialLinks[s.platform];
              const hasUrl = !!url;
              const icon = (
                <div
                  key={s.platform}
                  className={`flex h-9 w-9 items-center justify-center rounded-full bg-muted transition-colors ${
                    hasUrl
                      ? "text-foreground hover:bg-primary/10"
                      : "text-muted-foreground/30"
                  }`}
                  title={s.placeholder}
                >
                  <SocialIcon platform={s.platform} className="h-5 w-5" />
                </div>
              );
              if (hasUrl) {
                return (
                  <a
                    key={s.platform}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.placeholder}
                  >
                    {icon}
                  </a>
                );
              }
              return icon;
            })}
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            #{entry.rank} · {tLeaderboard("allTime")}
          </p>
        </div>
      </div>

      {/* Stats */}
      <section className="mb-8">
        <Card className="transition-shadow hover:shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[hsl(var(--brand-logo-green))]">
              <Award className="h-5 w-5" />
              {t("achievements")}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-6">
            <div>
              <p className="text-sm text-muted-foreground">XP</p>
              <p className="text-2xl font-bold text-sky-600">
                {entry.xp.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                {tLeaderboard("level")}
              </p>
              <p className="text-2xl font-bold">{entry.level}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                {tLeaderboard("streak")}
              </p>
              <p className="text-2xl font-bold">{entry.streak}</p>
            </div>
            <div>
              <span className="rounded-full bg-primary/20 px-3 py-1 text-sm font-medium text-primary">
                {t("firstSteps")}
              </span>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Skill radar */}
      <section className="mb-8">
        <Card className="transition-shadow hover:shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[hsl(var(--brand-logo-green))]">
              <Radar className="h-5 w-5" />
              {t("skillRadarTitle")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {SKILL_DATA.map((skill) => {
                const userLevel = isCurrentUser
                  ? skill.level
                  : Math.max(5, Math.round(skill.level * (entry.xp / 5000)));
                return (
                  <div key={skill.key} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{t(skill.key)}</span>
                      <span className="text-muted-foreground">
                        {userLevel}%
                      </span>
                    </div>
                    <div className="skill-radar-track h-2.5 w-full overflow-hidden rounded-full bg-sky-500/20">
                      <div
                        className="skill-radar-bar h-full rounded-full bg-sky-500 transition-all duration-500"
                        style={{ width: `${userLevel}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Credentials */}
      <section className="mb-8">
        <Card className="transition-shadow hover:shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[hsl(var(--brand-logo-green))]">
              <Shield className="h-5 w-5" />
              {t("credentials")}
            </CardTitle>
            <CardDescription>{t("credentialsDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {t("noCredentialsYet")}
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Completed courses */}
      <section>
        <Card className="transition-shadow hover:shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[hsl(var(--brand-logo-green))]">
              <BookOpen className="h-5 w-5" />
              {t("completedCourses")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{t("noCoursesYet")}</p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
