"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { learningProgressService } from "@/services/learning-progress";
import { useAuth } from "@/hooks/use-auth";
import type { Course } from "@/data/courses";
import { Flame } from "lucide-react";
import type { LeaderboardEntry } from "@/types/learning";

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <span
        className="flex h-8 w-8 items-center justify-center text-xl"
        role="img"
        aria-label="Gold medal"
      >
        🥇
      </span>
    );
  }
  if (rank === 2) {
    return (
      <span
        className="flex h-8 w-8 items-center justify-center text-xl"
        role="img"
        aria-label="Silver medal"
      >
        🥈
      </span>
    );
  }
  if (rank === 3) {
    return (
      <span
        className="flex h-8 w-8 items-center justify-center text-xl"
        role="img"
        aria-label="Bronze medal"
      >
        🥉
      </span>
    );
  }
  return (
    <span className="flex h-8 w-8 items-center justify-center text-sm font-bold text-muted-foreground">
      #{rank}
    </span>
  );
}

function LevelBadge({ level, label }: { level: number; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[hsl(var(--brand-logo-green)/.15)] px-2 py-0.5 text-xs font-semibold text-[hsl(var(--brand-logo-green))]">
      {label} {level}
    </span>
  );
}

function StreakDisplay({ streak, label }: { streak: number; label: string }) {
  if (streak <= 0) return null;
  return (
    <span className="inline-flex items-center gap-0.5 rounded-full bg-orange-100 px-2 py-0.5 text-xs font-semibold text-orange-600 dark:bg-orange-950 dark:text-orange-400">
      <Flame className="h-3 w-3" />
      {streak} {label}
    </span>
  );
}

const PROFILE_NAME_KEY = "st-academy:profile-name";
const PROFILE_AVATAR_KEY = "st-academy:profile-avatar";

interface LeaderboardClientProps {
  courses: Course[];
}

export function LeaderboardClient({ courses }: LeaderboardClientProps) {
  const t = useTranslations("leaderboard");
  const { connected, publicKey } = useAuth();
  const [timeframe, setTimeframe] = useState<"weekly" | "monthly" | "alltime">(
    "alltime",
  );
  const [selectedCourse, setSelectedCourse] = useState<string>("all");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [userName, setUserName] = useState<string>("");
  const [userAvatar, setUserAvatar] = useState<string>("");

  useEffect(() => {
    learningProgressService.getLeaderboard(timeframe).then(setEntries);
  }, [timeframe]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setUserName(localStorage.getItem(PROFILE_NAME_KEY) || "");
    setUserAvatar(localStorage.getItem(PROFILE_AVATAR_KEY) || "");
  }, []);

  const currentUserName =
    userName.trim() ||
    (publicKey
      ? `${publicKey.toBase58().slice(0, 4)}...${publicKey.toBase58().slice(-4)}`
      : "You");

  const stubEntries: LeaderboardEntry[] = [
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
      rank: 5,
      userId: "current-user",
      username: currentUserName,
      avatarUrl: userAvatar || "https://i.pravatar.cc/80?img=5",
      xp: 1500,
      level: 3,
      streak: 6,
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
  const displayEntries = entries.length > 0 ? entries : stubEntries;

  const isCurrentUser = (userId: string) =>
    connected && userId === "current-user";

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Course filter */}
        <div className="flex items-center gap-2">
          <label
            htmlFor="course-filter"
            className="text-sm font-medium text-muted-foreground whitespace-nowrap"
          >
            {t("filterByCourse")}
          </label>
          <select
            id="course-filter"
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="rounded-lg border bg-background px-3 py-1.5 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <option value="all">{t("allCourses")}</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.title}
              </option>
            ))}
          </select>
        </div>

        {/* Timeframe filters */}
        <div className="flex gap-2">
          {(["weekly", "monthly", "alltime"] as const).map((tf) => (
            <button
              key={tf}
              type="button"
              onClick={() => setTimeframe(tf)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-[0.98] ${
                timeframe === tf
                  ? "filter-badge-selected bg-[hsl(var(--brand-logo-green))] text-white"
                  : "bg-[hsl(var(--brand-logo-yellow))] text-[hsl(0,0%,9%)] hover:bg-[hsl(var(--brand-logo-yellow-light))]"
              }`}
            >
              {tf === "weekly"
                ? t("weekly")
                : tf === "monthly"
                  ? t("monthly")
                  : t("allTime")}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {displayEntries.map((entry) => {
            const isCurrent = isCurrentUser(entry.userId);
            return (
              <li
                key={entry.userId}
                className={`flex items-center justify-between rounded-lg border p-3 transition-colors ${
                  isCurrent
                    ? "border-[hsl(var(--brand-logo-green))] bg-[hsl(var(--brand-logo-green)/.08)] ring-1 ring-[hsl(var(--brand-logo-green)/.3)]"
                    : entry.rank <= 3
                      ? "border-transparent bg-muted/50"
                      : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <RankBadge rank={entry.rank} />
                  <Link
                    href={`/profile/${entry.userId}`}
                    className="flex items-center gap-3 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:rounded-full rounded-full"
                  >
                    {entry.avatarUrl ? (
                      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-muted ring-2 ring-background">
                        {isCurrent && entry.avatarUrl.startsWith("data:") ? (
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
                            sizes="40px"
                            unoptimized
                          />
                        )}
                      </div>
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-muted ring-2 ring-background" />
                    )}
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <p className="font-bold">{entry.username}</p>
                        {isCurrent && (
                          <span className="rounded-full bg-[hsl(var(--brand-logo-green))] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                            {t("you")}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <LevelBadge level={entry.level} label={t("level")} />
                        <StreakDisplay
                          streak={entry.streak}
                          label={t("streak")}
                        />
                      </div>
                    </div>
                  </Link>
                </div>
                <span
                  className={`text-right font-semibold tabular-nums ${
                    entry.rank === 1
                      ? "text-yellow-600 dark:text-yellow-400"
                      : entry.rank === 2
                        ? "text-gray-500 dark:text-gray-400"
                        : entry.rank === 3
                          ? "text-amber-700 dark:text-amber-500"
                          : "text-sky-600"
                  }`}
                >
                  {entry.xp.toLocaleString()} XP
                </span>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
