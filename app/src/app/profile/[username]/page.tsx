"use client";

import { useState, useMemo, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Github,
  Twitter,
  Globe,
  ExternalLink,
  Clock,
  Copy,
  Check,
  CheckCircle2,
  Lock,
} from "lucide-react";
import { useWallet } from "@solana/wallet-adapter-react";
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

interface PublicUser {
  name: string;
  username: string;
  bio: string;
  initials: string;
  avatarUrl: string | null;
  joinDate: string;
  walletAddress: string | null;
  isPublic: boolean;
  socialLinks: { github?: string; twitter?: string; website?: string };
}

/* ── NFT Artwork (same as profile page) ── */

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
        <radialGradient id={`gp${variant}`}>
          <stop offset="0%" stopColor={accent} stopOpacity="0.25" />
          <stop offset="70%" stopColor={accent} stopOpacity="0.03" />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="120" cy="120" r="100" fill={`url(#gp${variant})`} />
      {variant === 0 && (
        <>
          <polygon points={hex(120, 120, 80)} fill="none" stroke={accent} strokeOpacity="0.12" strokeWidth="1" />
          <polygon points={hex(120, 120, 56)} fill="none" stroke={accent} strokeOpacity="0.18" strokeWidth="1" />
          <polygon points="120,80 160,120 120,160 80,120" fill={accent} fillOpacity="0.08" stroke={accent} strokeOpacity="0.35" strokeWidth="1.5" />
        </>
      )}
      {variant === 1 && (
        <>
          <circle cx="120" cy="120" r="55" fill="none" stroke={accent} strokeOpacity="0.15" strokeWidth="1" />
          <line x1="120" y1="88" x2="120" y2="152" stroke={accent} strokeOpacity="0.35" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M98 142 Q120 165 142 142" fill="none" stroke={accent} strokeOpacity="0.35" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="120" cy="98" r="8" fill="none" stroke={accent} strokeOpacity="0.3" strokeWidth="2" />
        </>
      )}
      {variant === 2 && (
        <>
          <path d="M120 70 L165 95 L165 145 L120 170 L75 145 L75 95 Z" fill={accent} fillOpacity="0.06" stroke={accent} strokeOpacity="0.25" strokeWidth="1.5" strokeLinejoin="round" />
          <rect x="111" y="118" width="18" height="14" rx="2" fill={accent} fillOpacity="0.25" />
          <path d="M114 118 L114 112 Q114 105 120 105 Q126 105 126 112 L126 118" fill="none" stroke={accent} strokeOpacity="0.3" strokeWidth="1.5" />
          <circle cx="120" cy="125" r="2" fill={accent} fillOpacity="0.5" />
        </>
      )}
      <rect x="1" y="1" width="238" height="238" rx="11" fill="none" stroke={accent} strokeOpacity="0.12" strokeWidth="0.5" />
    </svg>
  );
}

function CredentialCard({ credential, index }: { credential: Credential; index: number }) {
  const { t } = useLocale();
  const [copied, setCopied] = useState(false);
  const truncated = credential.mintAddress.slice(0, 4) + "..." + credential.mintAddress.slice(-4);

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
          <span className="text-[10px] font-medium" style={{ color: credential.accent }}>
            {credential.level}
          </span>
          <span className="text-muted-foreground/50">·</span>
          <span className="text-[10px] text-muted-foreground/60">{credential.earnedAt}</span>
        </div>
        <div className="flex items-center gap-1.5 mt-2.5 text-[10px] text-muted-foreground/60">
          <span className="font-mono">{truncated}</span>
          <button onClick={handleCopy} className="hover:text-foreground transition-colors">
            {copied ? <Check className="size-2.5 text-emerald-400" /> : <Copy className="size-2.5" />}
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

/* ── Badge rarity maps ── */

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

/* ── Try to find user from localStorage (all stored users) ── */

function findLocalUserByUsername(username: string): PublicUser | null {
  if (typeof window === "undefined") return null;
  try {
    const all = JSON.parse(localStorage.getItem("academy_user") || "{}");
    for (const key of Object.keys(all)) {
      const u = all[key];
      if (u?.username === username && u?.isPublic !== false) {
        return {
          name: u.name ?? "Learner",
          username: u.username,
          bio: u.bio ?? "",
          initials: u.initials ?? u.name?.slice(0, 2)?.toUpperCase() ?? "SL",
          avatarUrl: u.avatarUrl ?? null,
          joinDate: u.joinDate ?? "",
          walletAddress: u.walletAddress ?? null,
          isPublic: u.isPublic ?? true,
          socialLinks: u.socialLinks ?? {},
        };
      }
    }
  } catch {
    // ignore
  }
  return null;
}

export default function PublicProfilePage() {
  const params = useParams<{ username: string }>();
  const username = params.username;
  const { publicKey } = useWallet();
  const { user: currentUser } = useAuth();
  const { t } = useLocale();

  const [profileUser, setProfileUser] = useState<PublicUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [xpBalance, setXpBalance] = useState<number | null>(null);
  const [liveCredentials, setLiveCredentials] = useState<Credential[] | null>(null);
  const [liveAchievements, setLiveAchievements] = useState<Achievement[] | null>(null);
  const [allCourses, setAllCourses] = useState<CourseDetail[]>([]);
  const [enrollments, setEnrollments] = useState<CourseProgress[]>([]);
  const [rank, setRank] = useState<number | null>(null);
  const [totalLearners, setTotalLearners] = useState<number>(0);

  // If this is the current user's profile, redirect-style: show their data
  const isOwnProfile = currentUser?.username === username;

  // Load user data
  useEffect(() => {
    if (!username) return;

    // If it's the current user, use their data directly
    if (isOwnProfile && currentUser) {
      setProfileUser({
        name: currentUser.name,
        username: currentUser.username,
        bio: currentUser.bio,
        initials: currentUser.initials,
        avatarUrl: currentUser.avatarUrl,
        joinDate: currentUser.joinDate,
        walletAddress: currentUser.walletAddress,
        isPublic: currentUser.isPublic,
        socialLinks: currentUser.socialLinks,
      });
      setLoading(false);
      return;
    }

    // Try localStorage first (instant)
    const localUser = findLocalUserByUsername(username);
    if (localUser) {
      setProfileUser(localUser);
      setLoading(false);
      return;
    }

    // Try API (Supabase)
    fetch(`/api/users/by-username?username=${encodeURIComponent(username)}`)
      .then((res) => {
        if (!res.ok) throw new Error("not found");
        return res.json();
      })
      .then((data) => {
        if (data.user) {
          setProfileUser(data.user);
        } else {
          setNotFound(true);
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [username, isOwnProfile, currentUser]);

  // Load XP, credentials, achievements, courses for this user
  useEffect(() => {
    if (!profileUser?.walletAddress) return;
    const wallet = profileUser.walletAddress;

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
  }, [profileUser]);

  const xpData = xpBalance !== null ? xpProgress(xpBalance) : null;
  const displayLevel = xpData?.level ?? 0;
  const displayTotalXP = xpBalance ?? 0;
  const displayXpPct = xpData ? Math.round(xpData.progress * 100) : 0;
  const displayCredentials = liveCredentials ?? [];
  const displayAchievements = liveAchievements ?? [];

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
                  (progress.completedLessons.length / course.lessons) * course.xp,
                )
              : 0,
        };
      })
      .filter(
        (c): c is CourseDetail & { completedAt: string; xpEarned: number } =>
          c !== null,
      );
  }, [enrollments, allCourses]);

  /* ── Loading state ── */
  if (loading) {
    return (
      <div className="relative min-h-screen">
        <div className="pointer-events-none absolute inset-0 bg-mesh animate-drift-2" />
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="size-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  /* ── Not found state ── */
  if (notFound || !profileUser) {
    return (
      <div className="relative min-h-screen">
        <div className="pointer-events-none absolute inset-0 bg-mesh animate-drift-2" />
        <div className="relative z-10 mx-auto max-w-md px-6 pt-40 text-center">
          <div className="flex size-16 mx-auto items-center justify-center rounded-full bg-muted/30 mb-4">
            <Lock className="size-6 text-muted-foreground/60" />
          </div>
          <h1 className="text-xl font-semibold">{t("profile.profileNotFound")}</h1>
          <p className="mt-2 text-sm text-muted-foreground/70">
            {t("profile.profileNotFoundDesc")}
          </p>
          <Link
            href="/leaderboard"
            className="inline-block mt-6 text-sm text-primary hover:underline"
          >
            {t("profile.viewLeaderboard")}
          </Link>
        </div>
      </div>
    );
  }

  /* ── Public profile view ── */
  return (
    <div className="relative min-h-screen">
      <div className="pointer-events-none absolute inset-0 bg-mesh animate-drift-2" />

      <div className="relative z-10 mx-auto max-w-4xl px-6 pt-28 pb-20">
        {/* ── Profile Header ── */}
        <div className="flex flex-col sm:flex-row gap-5 items-start">
          <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xl font-bold border border-primary/20">
            {profileUser.initials}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-3">
              <h1 className="text-2xl font-semibold tracking-tight">
                {profileUser.name}
              </h1>
              <span className="text-sm text-muted-foreground/70">
                @{profileUser.username}
              </span>
            </div>

            {profileUser.bio && (
              <p className="mt-1.5 text-sm text-muted-foreground max-w-lg">
                {profileUser.bio}
              </p>
            )}

            <div className="mt-2.5 flex flex-wrap items-center gap-3 text-xs text-muted-foreground/70">
              {profileUser.joinDate && (
                <span className="flex items-center gap-1">
                  <Clock className="size-3" />
                  {t("profile.joined")} {profileUser.joinDate}
                </span>
              )}
              {profileUser.socialLinks?.github && (
                <a
                  href={profileUser.socialLinks.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-foreground transition-colors"
                >
                  <Github className="size-3" />
                  GitHub
                </a>
              )}
              {profileUser.socialLinks?.twitter && (
                <a
                  href={profileUser.socialLinks.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-foreground transition-colors"
                >
                  <Twitter className="size-3" />
                  Twitter
                </a>
              )}
              {profileUser.socialLinks?.website && (
                <a
                  href={profileUser.socialLinks.website}
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

          {isOwnProfile && (
            <Link
              href="/settings"
              className="shrink-0 text-xs text-muted-foreground/70 hover:text-foreground border border-border/40 rounded-lg px-3 py-1.5 transition-colors"
            >
              {t("profile.editProfile")}
            </Link>
          )}
        </div>

        {/* ── Stats ── */}
        <div className="mt-6 grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-border/30 p-4">
            <p className="text-[11px] text-muted-foreground/60 uppercase tracking-wider">
              {t("common.level")}
            </p>
            <p className="mt-1 text-3xl font-bold tabular-nums">{displayLevel}</p>
            <div className="mt-2.5 h-1.5 rounded-full bg-border/25">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${displayXpPct}%` }}
              />
            </div>
            <p className="mt-1.5 text-[10px] text-muted-foreground/60 tabular-nums">
              {(xpData?.currentLevelXp ?? 0).toLocaleString()} /{" "}
              {(xpData?.xpToNextLevel ?? 100).toLocaleString()} XP
            </p>
          </div>

          <div className="rounded-xl border border-border/30 p-4">
            <p className="text-[11px] text-muted-foreground/60 uppercase tracking-wider">
              {t("profile.totalXp")}
            </p>
            <p className="mt-1 text-3xl font-bold tabular-nums">
              {displayTotalXP.toLocaleString()}
            </p>
            <p className="mt-2.5 text-[10px] text-muted-foreground/60">
              {t("profile.credentialsEarned", { count: displayCredentials.length })}
            </p>
          </div>

          <div className="rounded-xl border border-border/30 p-4">
            <p className="text-[11px] text-muted-foreground/60 uppercase tracking-wider">
              {t("common.rank")}
            </p>
            <p className="mt-1 text-3xl font-bold tabular-nums">#{rank ?? "–"}</p>
            <p className="mt-2.5 text-[10px] text-muted-foreground/60">
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
          <h2 className="text-lg font-semibold">{t("profile.onChainCredentials")}</h2>
          <p className="text-[11px] text-muted-foreground/60 mt-1">
            {t("profile.onChainCredentialsDesc")}
          </p>

          {displayCredentials.length > 0 ? (
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              {displayCredentials.map((cred, i) => (
                <CredentialCard key={cred.id} credential={cred} index={i} />
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground/60">
              {t("profile.noCredentials")}
            </p>
          )}
        </div>

        {/* ── Achievement Showcase ── */}
        <div className="mt-10">
          <h2 className="text-lg font-semibold">{t("common.achievements")}</h2>
          <p className="text-[11px] text-muted-foreground/60 mt-1">
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
            <p className="mt-4 text-sm text-muted-foreground/60">
              {t("dashboard.noAchievements")}
            </p>
          )}
        </div>

        {/* ── Completed Courses ── */}
        <div className="mt-10">
          <h2 className="text-lg font-semibold">{t("profile.completedCourses")}</h2>

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
                        <span className="text-[11px] text-muted-foreground/60">
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
                      <span className="text-[10px] text-muted-foreground/60">
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
            <p className="mt-4 text-sm text-muted-foreground/60">
              {t("dashboard.noEnrolledCourses")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
