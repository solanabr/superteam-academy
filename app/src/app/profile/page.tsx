"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  Github,
  Twitter,
  Globe,
  ExternalLink,
  Lock,
  Unlock,
  CheckCircle2,
  Clock,
  Copy,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useAuth } from "@/providers/auth-provider";
import { useLocale } from "@/providers/locale-provider";
import {
  xpService,
  credentialService,
  achievementService,
  progressService,
  leaderboardService,
} from "@/services";
import { getAllCourses } from "@/lib/sanity-fetch";
import { xpProgress } from "@/types";
import type {
  Achievement,
  Credential,
  CourseDetail,
  CourseProgress,
} from "@/types";

/* ── NFT Artwork (inline SVG per credential) ── */

function NftArt({ accent, variant }: { accent: string; variant: number }) {
  const hex = (cx: number, cy: number, r: number) =>
    Array.from({ length: 6 }, (_, i) => {
      const a = (Math.PI / 3) * i - Math.PI / 2;
      return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
    }).join(" ");

  return (
    <svg viewBox="0 0 240 240" className="w-full aspect-square rounded-t-xl">
      <rect width="240" height="240" fill="#08080a" />

      <defs>
        <radialGradient id={`g${variant}`}>
          <stop offset="0%" stopColor={accent} stopOpacity="0.25" />
          <stop offset="70%" stopColor={accent} stopOpacity="0.03" />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="120" cy="120" r="100" fill={`url(#g${variant})`} />

      {/* Variant 0 — Solana Core: hex grid + diamond */}
      {variant === 0 && (
        <>
          <polygon
            points={hex(120, 120, 80)}
            fill="none"
            stroke={accent}
            strokeOpacity="0.12"
            strokeWidth="1"
          />
          <polygon
            points={hex(120, 120, 56)}
            fill="none"
            stroke={accent}
            strokeOpacity="0.18"
            strokeWidth="1"
          />
          <polygon
            points={hex(120, 120, 32)}
            fill="none"
            stroke={accent}
            strokeOpacity="0.12"
            strokeWidth="0.5"
          />
          <polygon
            points="120,80 160,120 120,160 80,120"
            fill={accent}
            fillOpacity="0.08"
            stroke={accent}
            strokeOpacity="0.35"
            strokeWidth="1.5"
          />
          <polygon
            points="120,94 146,120 120,146 94,120"
            fill={accent}
            fillOpacity="0.12"
            stroke={accent}
            strokeOpacity="0.2"
            strokeWidth="1"
          />
          {[0, 1, 2, 3, 4, 5].map((i) => {
            const a = (Math.PI / 3) * i - Math.PI / 2;
            return (
              <circle
                key={i}
                cx={120 + 80 * Math.cos(a)}
                cy={120 + 80 * Math.sin(a)}
                r="2"
                fill={accent}
                fillOpacity="0.3"
              />
            );
          })}
        </>
      )}

      {/* Variant 1 — Anchor: circles + anchor */}
      {variant === 1 && (
        <>
          <circle
            cx="120"
            cy="120"
            r="75"
            fill="none"
            stroke={accent}
            strokeOpacity="0.1"
            strokeWidth="0.5"
            strokeDasharray="4 4"
          />
          <circle
            cx="120"
            cy="120"
            r="55"
            fill="none"
            stroke={accent}
            strokeOpacity="0.15"
            strokeWidth="1"
          />
          <circle
            cx="120"
            cy="120"
            r="35"
            fill="none"
            stroke={accent}
            strokeOpacity="0.1"
            strokeWidth="0.5"
          />
          <line
            x1="120"
            y1="88"
            x2="120"
            y2="152"
            stroke={accent}
            strokeOpacity="0.35"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <line
            x1="120"
            y1="88"
            x2="100"
            y2="108"
            stroke={accent}
            strokeOpacity="0.25"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <line
            x1="120"
            y1="88"
            x2="140"
            y2="108"
            stroke={accent}
            strokeOpacity="0.25"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path
            d="M98 142 Q120 165 142 142"
            fill="none"
            stroke={accent}
            strokeOpacity="0.35"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <circle
            cx="120"
            cy="98"
            r="8"
            fill="none"
            stroke={accent}
            strokeOpacity="0.3"
            strokeWidth="2"
          />
          <line
            x1="45"
            y1="120"
            x2="75"
            y2="120"
            stroke={accent}
            strokeOpacity="0.06"
            strokeWidth="0.5"
          />
          <line
            x1="165"
            y1="120"
            x2="195"
            y2="120"
            stroke={accent}
            strokeOpacity="0.06"
            strokeWidth="0.5"
          />
        </>
      )}

      {/* Variant 2 — Security: crosshairs + shield */}
      {variant === 2 && (
        <>
          {[60, 90, 150, 180].map((v) => (
            <line
              key={`h${v}`}
              x1="40"
              y1={v}
              x2="200"
              y2={v}
              stroke={accent}
              strokeOpacity="0.05"
              strokeWidth="0.5"
            />
          ))}
          {[60, 90, 150, 180].map((v) => (
            <line
              key={`v${v}`}
              x1={v}
              y1="40"
              x2={v}
              y2="200"
              stroke={accent}
              strokeOpacity="0.05"
              strokeWidth="0.5"
            />
          ))}
          <line
            x1="55"
            y1="55"
            x2="185"
            y2="185"
            stroke={accent}
            strokeOpacity="0.04"
            strokeWidth="0.5"
          />
          <line
            x1="185"
            y1="55"
            x2="55"
            y2="185"
            stroke={accent}
            strokeOpacity="0.04"
            strokeWidth="0.5"
          />
          <path
            d="M120 70 L165 95 L165 145 L120 170 L75 145 L75 95 Z"
            fill={accent}
            fillOpacity="0.06"
            stroke={accent}
            strokeOpacity="0.25"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path
            d="M120 88 L150 105 L150 137 L120 154 L90 137 L90 105 Z"
            fill={accent}
            fillOpacity="0.1"
            stroke={accent}
            strokeOpacity="0.15"
            strokeWidth="1"
            strokeLinejoin="round"
          />
          <rect
            x="111"
            y="118"
            width="18"
            height="14"
            rx="2"
            fill={accent}
            fillOpacity="0.25"
          />
          <path
            d="M114 118 L114 112 Q114 105 120 105 Q126 105 126 112 L126 118"
            fill="none"
            stroke={accent}
            strokeOpacity="0.3"
            strokeWidth="1.5"
          />
          <circle cx="120" cy="125" r="2" fill={accent} fillOpacity="0.5" />
        </>
      )}

      <rect
        x="1"
        y="1"
        width="238"
        height="238"
        rx="11"
        fill="none"
        stroke={accent}
        strokeOpacity="0.12"
        strokeWidth="0.5"
      />
    </svg>
  );
}

/* ── Credential NFT Card ── */

function CredentialCard({
  credential,
  index,
}: {
  credential: Credential;
  index: number;
}) {
  const { t } = useLocale();
  const [copied, setCopied] = useState(false);
  const truncated =
    credential.mintAddress.slice(0, 4) +
    "..." +
    credential.mintAddress.slice(-4);

  function handleCopy() {
    navigator.clipboard.writeText(credential.mintAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="rounded-xl border border-border/30 overflow-hidden group hover:border-border/50 transition-colors">
      <NftArt accent={credential.accent} variant={index % 3} />
      <div className="p-4">
        <p className="text-sm font-semibold">{credential.track}</p>
        <div className="flex items-center gap-2 mt-1">
          <span
            className="text-[10px] font-medium"
            style={{ color: credential.accent }}
          >
            {credential.level}
          </span>
          <span className="text-muted-foreground">·</span>
          <span className="text-[10px] text-muted-foreground">
            {credential.earnedAt}
          </span>
        </div>
        <div className="flex items-center gap-1.5 mt-2.5 text-[10px] text-muted-foreground">
          <span className="font-mono">{truncated}</span>
          <button
            aria-label="Copy address"
            onClick={handleCopy}
            className="hover:text-foreground transition-colors"
          >
            {copied ? (
              <Check className="size-2.5 text-emerald-400" />
            ) : (
              <Copy className="size-2.5" />
            )}
          </button>
          <span className="flex-1" />
          <button className="hover:text-foreground transition-colors flex items-center gap-0.5">
            <ExternalLink className="size-2.5" />
            {t("common.verify")}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Hex badge rarity maps ── */

const rarityGradient: Record<string, string> = {
  common: "linear-gradient(160deg, #52525b, #a1a1aa, #52525b)",
  rare: "linear-gradient(160deg, #1d4ed8, #60a5fa, #1d4ed8)",
  epic: "linear-gradient(160deg, #6d28d9, #a78bfa, #6d28d9)",
  legendary: "linear-gradient(160deg, #b45309, #fbbf24, #f59e0b, #b45309)",
};

const rarityShine: Record<string, number> = {
  common: 0.08,
  rare: 0.12,
  epic: 0.15,
  legendary: 0.25,
};

const rarityGlow: Record<string, string> = {
  common: "none",
  rare: "drop-shadow(0 0 6px rgba(59,130,246,0.2))",
  epic: "drop-shadow(0 0 6px rgba(139,92,246,0.25))",
  legendary: "drop-shadow(0 0 8px rgba(251,191,36,0.35))",
};

/* ── Page ── */

export default function ProfilePage() {
  const { publicKey, connected } = useWallet();
  const { setVisible } = useWalletModal();
  const { user } = useAuth();
  const { t } = useLocale();

  const [xpBalance, setXpBalance] = useState<number | null>(null);
  const [liveCredentials, setLiveCredentials] = useState<Credential[] | null>(
    null,
  );
  const [liveAchievements, setLiveAchievements] = useState<
    Achievement[] | null
  >(null);
  const [allCourses, setAllCourses] = useState<CourseDetail[]>([]);
  const [enrollments, setEnrollments] = useState<CourseProgress[]>([]);
  const [rank, setRank] = useState<number | null>(null);
  const [totalLearners, setTotalLearners] = useState<number>(0);

  useEffect(() => {
    if (!connected || !publicKey) return;
    const wallet = publicKey.toBase58();
    Promise.all([
      xpService.getBalance(wallet),
      credentialService.getCredentials(wallet),
      achievementService.getAchievements(wallet),
      progressService.getAllEnrollments(wallet),
      leaderboardService.getRank(wallet),
      leaderboardService.getEntries("all-time", undefined, 1, 1),
      getAllCourses(),
    ]).then(([xp, creds, achieve, enroll, userRank, lb, courses]) => {
      setXpBalance(xp);
      setLiveCredentials(creds);
      setLiveAchievements(achieve);
      setEnrollments(enroll);
      setRank(userRank);
      setTotalLearners(userRank !== null ? lb.total + 1 : lb.total);
      setAllCourses(courses);
    });
  }, [connected, publicKey]);

  const [isPublic, setIsPublic] = useState(user?.isPublic ?? true);

  const xpData = xpBalance !== null ? xpProgress(xpBalance) : null;
  const displayLevel = xpData?.level ?? 0;
  const displayTotalXP = xpBalance ?? 0;
  const displayXpPct = xpData ? Math.round(xpData.progress * 100) : 0;

  const displayCredentials = liveCredentials ?? [];
  const displayAchievements = liveAchievements ?? [];

  // Completed / in-progress courses from enrollment data
  const completedCourses = useMemo(() => {
    return enrollments
      .map((progress) => {
        const course = allCourses.find((c) => c.slug === progress.courseId);
        if (!course) return null;
        const isComplete = progress.completedAt !== null;
        return {
          ...course,
          completed: progress.completedLessons.length,
          completedAt: isComplete
            ? new Date(progress.completedAt!).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })
            : "In progress",
          xpEarned:
            course.lessons > 0
              ? Math.round(
                  (progress.completedLessons.length / course.lessons) *
                    course.xp,
                )
              : 0,
        };
      })
      .filter(
        (
          c,
        ): c is CourseDetail & {
          completedAt: string;
          xpEarned: number;
        } => c !== null,
      );
  }, [enrollments, allCourses]);

  const profileName = user?.name ?? "Learner";
  const profileUsername = user?.username ?? "learner";
  const profileBio = user?.bio ?? "";
  const profileInitials = user?.initials ?? profileName.slice(0, 2).toUpperCase();
  const profileJoinDate = user?.joinDate ?? "";

  if (!connected) {
    return (
      <div className="relative min-h-screen flex items-center justify-center">
        <div className="pointer-events-none absolute inset-0 bg-mesh animate-drift-2" />
        <div className="relative z-10 text-center">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-primary/10 border border-primary/20">
            <Lock className="size-6 text-primary" />
          </div>
          <h1 className="mt-4 text-xl font-semibold">{t("profile.connectToView")}</h1>
          <p className="mt-2 text-sm text-muted-foreground max-w-xs mx-auto">
            {t("profile.connectToViewDesc")}
          </p>
          <Button className="mt-6" onClick={() => setVisible(true)}>
            {t("common.connectWallet")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      <div className="pointer-events-none absolute inset-0 bg-mesh animate-drift-2" />

      <div className="relative z-10 mx-auto max-w-4xl px-6 pt-28 pb-20">
        {/* ── Profile Header ── */}
        <div className="flex flex-col sm:flex-row gap-5 items-start">
          <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xl font-bold border border-primary/20">
            {profileInitials}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-3">
              <h1 className="text-2xl font-semibold tracking-tight">
                {profileName}
              </h1>
              <span className="text-sm text-muted-foreground">
                @{profileUsername}
              </span>
            </div>

            {profileBio && (
              <p className="mt-1.5 text-sm text-muted-foreground max-w-lg">
                {profileBio}
              </p>
            )}

            <div className="mt-2.5 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              {profileJoinDate && (
                <span className="flex items-center gap-1">
                  <Clock className="size-3" />
                  {t("profile.joined")} {profileJoinDate}
                </span>
              )}
              {user?.socialLinks?.github && (
                <a
                  href={user.socialLinks.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-foreground transition-colors"
                >
                  <Github className="size-3" />
                  GitHub
                </a>
              )}
              {user?.socialLinks?.twitter && (
                <a
                  href={user.socialLinks.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-foreground transition-colors"
                >
                  <Twitter className="size-3" />
                  Twitter
                </a>
              )}
              {user?.socialLinks?.website && (
                <a
                  href={user.socialLinks.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-foreground transition-colors"
                >
                  <Globe className="size-3" />
                  {t("common.website")}
                </a>
              )}
            </div>
          </div>

          <Link
            href="/settings"
            className="shrink-0 text-xs text-muted-foreground hover:text-foreground border border-border/40 rounded-lg px-3 py-1.5 transition-colors"
          >
            {t("profile.editProfile")}
          </Link>
        </div>

        {/* ── Stats ── */}
        <div className="mt-6 grid grid-cols-3 gap-3">
          {/* Level */}
          <div className="rounded-xl border border-border/30 p-4">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider">
              {t("common.level")}
            </p>
            <p className="mt-1 text-3xl font-bold tabular-nums">
              {displayLevel}
            </p>
            <div className="mt-2.5 h-1.5 rounded-full bg-border/25">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${displayXpPct}%` }}
              />
            </div>
            <p className="mt-1.5 text-[10px] text-muted-foreground tabular-nums">
              {(xpData?.currentLevelXp ?? 0).toLocaleString()} /{" "}
              {(xpData?.xpToNextLevel ?? 100).toLocaleString()} XP
            </p>
          </div>

          {/* XP */}
          <div className="rounded-xl border border-border/30 p-4">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider">
              {t("profile.totalXp")}
            </p>
            <p className="mt-1 text-3xl font-bold tabular-nums">
              {displayTotalXP.toLocaleString()}
            </p>
            <p className="mt-2.5 text-[10px] text-muted-foreground">
              {t("profile.credentialsEarned", {
                count: displayCredentials.length,
              })}
            </p>
          </div>

          {/* Rank */}
          <div className="rounded-xl border border-border/30 p-4">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider">
              {t("common.rank")}
            </p>
            <p className="mt-1 text-3xl font-bold tabular-nums">
              #{rank ?? "–"}
            </p>
            <p className="mt-2.5 text-[10px] text-muted-foreground">
              {totalLearners > 0 && (
                <>
                  {t("common.of")} {totalLearners.toLocaleString()}{" "}
                  {t("common.learners")}
                </>
              )}
            </p>
          </div>
        </div>

        {/* ── On-Chain Credentials ── */}
        <div className="mt-10">
          <h2 className="text-lg font-semibold">
            {t("profile.onChainCredentials")}
          </h2>
          <p className="text-[11px] text-muted-foreground mt-1">
            {t("profile.onChainCredentialsDesc")}
          </p>

          {displayCredentials.length > 0 ? (
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              {displayCredentials.map((cred, i) => (
                <CredentialCard key={cred.id} credential={cred} index={i} />
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">
              {t("profile.noCredentials")}
            </p>
          )}
        </div>

        {/* ── Achievement Showcase ── */}
        <div className="mt-10">
          <h2 className="text-lg font-semibold">{t("common.achievements")}</h2>
          <p className="text-[11px] text-muted-foreground mt-1">
            {t("profile.badgesEarned", { count: displayAchievements.length })}
          </p>

          {displayAchievements.length > 0 ? (
            <div className="mt-5 grid grid-cols-4 sm:grid-cols-8 gap-x-3 gap-y-4">
              {displayAchievements.map((a, i) => (
                <div key={a.id} className="group text-center">
                  <div
                    className={`relative mx-auto w-14 h-16 transition-transform duration-300 group-hover:scale-110 ${
                      a.rarity === "legendary" ? "animate-badge-float" : ""
                    }`}
                    style={{ filter: rarityGlow[a.rarity] }}
                    title={`${a.title} — ${a.description}`}
                  >
                    <div
                      className="absolute inset-0 badge-hex"
                      style={{ background: rarityGradient[a.rarity] }}
                    />
                    <div className="absolute inset-0.5 badge-hex bg-card flex items-center justify-center">
                      <span className="text-xl leading-none">{a.icon}</span>
                    </div>
                    <div className="absolute inset-0 badge-hex pointer-events-none">
                      <div
                        className="absolute top-0 h-full w-3/5"
                        style={{
                          background: `linear-gradient(105deg, transparent 30%, rgba(255,255,255,${rarityShine[a.rarity]}) 50%, transparent 70%)`,
                          animation: `badge-shine 4s ease-in-out ${i * 0.5}s infinite`,
                        }}
                      />
                    </div>
                  </div>
                  <p className="mt-1.5 text-[9px] font-medium truncate leading-tight">
                    {a.title}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">
              {t("dashboard.noAchievements")}
            </p>
          )}
        </div>

        {/* ── Completed Courses ── */}
        <div className="mt-10">
          <h2 className="text-lg font-semibold">
            {t("profile.completedCourses")}
          </h2>

          {completedCourses.length > 0 ? (
            <div className="mt-4 rounded-xl border border-border/30 overflow-hidden divide-y divide-border/15">
              {completedCourses.map((course) => {
                const progress = Math.round(
                  (course.completed / course.lessons) * 100,
                );
                const isFinished = progress === 100;

                return (
                  <Link
                    key={course.slug}
                    href={`/courses/${course.slug}`}
                    className="flex items-center gap-3 p-4 hover:bg-muted/4 transition-colors"
                  >
                    <div
                      className="flex size-9 shrink-0 items-center justify-center rounded-lg"
                      style={{
                        background: `${course.accent}10`,
                        color: course.accent,
                      }}
                    >
                      <course.icon className="size-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">
                          {course.title}
                        </p>
                        {isFinished && (
                          <CheckCircle2
                            className="size-3.5 shrink-0"
                            style={{ color: course.accent }}
                          />
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="h-1 w-24 rounded-full bg-border/25">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${progress}%`,
                              background: course.accent,
                            }}
                          />
                        </div>
                        <span className="text-[11px] text-muted-foreground">
                          {t("dashboard.lessonsDetail", {
                            completed: course.completed,
                            total: course.lessons,
                          })}
                        </span>
                      </div>
                    </div>
                    <div className="hidden sm:flex flex-col items-end gap-0.5 shrink-0">
                      <span className="text-xs font-medium tabular-nums">
                        {course.xpEarned.toLocaleString()} XP
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {course.completedAt === "In progress"
                          ? t("profile.inProgress")
                          : course.completedAt}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">
              {t("dashboard.noEnrolledCourses")}
            </p>
          )}
        </div>

        {/* ── Visibility Toggle ── */}
        <div className="mt-10 flex items-center justify-between rounded-xl border border-border/30 px-5 py-4">
          <div className="flex items-center gap-3">
            {isPublic ? (
              <Unlock className="size-4 text-primary" />
            ) : (
              <Lock className="size-4 text-muted-foreground" />
            )}
            <div>
              <p className="text-sm font-medium">
                {t("profile.profileVisibility")}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {isPublic
                  ? t("profile.profileVisibleEveryone")
                  : t("profile.profileVisibleOnlyYou")}
              </p>
            </div>
          </div>
          <button
            role="switch"
            aria-checked={isPublic}
            aria-label="Toggle profile visibility"
            onClick={() => setIsPublic(!isPublic)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
              isPublic ? "bg-primary" : "bg-border"
            }`}
          >
            <span
              className={`pointer-events-none inline-block size-5 transform rounded-full bg-white shadow-lg ring-0 transition-transform ${
                isPublic ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
