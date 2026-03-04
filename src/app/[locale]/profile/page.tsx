"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useWallet } from "@solana/wallet-adapter-react";
import { useSession } from "next-auth/react";
import { useXpBalance } from "@/hooks/useXpBalance";
import { useAllEnrollments } from "@/hooks/useEnrollment";
import { useCourses } from "@/hooks/useCourses";
import { useCredentials } from "@/hooks/useCredentials";
import { useSigningMode } from "@/hooks/useSigningMode";
import { useStubXp } from "@/hooks/useStubXp";
import { countCompletedLessons, normalizeFlags } from "@/lib/bitmap";
import { PageSkeleton } from "@/components/Skeleton";
import { ErrorBanner } from "@/components/ErrorBanner";
import { CredentialCard } from "@/components/CredentialCard";
import { getEnrollmentPda } from "@/lib/pda";
import { PublicKey } from "@solana/web3.js";
import { useState, useEffect } from "react";
import { useAuthGate } from "@/hooks/useAuthGate";
import {
  Edit3,
  Check,
  X,
  Twitter,
  Github,
  Globe,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";
import { useAchievements } from "@/hooks/useAchievements";
import { AchievementGrid } from "@/components/AchievementBadge";
import { SpotlightCard } from "@/components/ui/spotlight-card";
import {
  getProfileBySubject,
  upsertProfile,
} from "@/services/IdentityProfileService";
import {
  getPublicProfileUsernameByWallet,
  publishPublicProfile,
} from "@/services/PublicProfileService";

type TValues = Record<string, string | number>;
type ProfileT = (key: string, values?: TValues) => string;

// ── localStorage profile helpers ──────────────────────────────────────────────
interface UserProfile {
  displayName: string;
  bio: string;
  twitter: string;
  github: string;
  website: string;
  isPublic: boolean;
}

const DEFAULT_PROFILE: UserProfile = {
  displayName: "",
  bio: "",
  twitter: "",
  github: "",
  website: "",
  isPublic: true,
};

function loadProfile(wallet: string): UserProfile {
  if (typeof window === "undefined") return DEFAULT_PROFILE;
  try {
    const raw = localStorage.getItem(`academy_profile_${wallet}`);
    if (raw) return { ...DEFAULT_PROFILE, ...(JSON.parse(raw) as UserProfile) };
  } catch {}
  return DEFAULT_PROFILE;
}

function saveProfile(wallet: string, profile: UserProfile) {
  localStorage.setItem(`academy_profile_${wallet}`, JSON.stringify(profile));
}

// ── Avatar initials ───────────────────────────────────────────────────────────
function AvatarInitials({
  wallet,
  name,
  size = 64,
}: {
  wallet: string;
  name?: string;
  size?: number;
}) {
  const initials = name
    ? name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : wallet.slice(0, 2).toUpperCase();

  const hue = wallet
    .split("")
    .reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360;

  return (
    <div
      aria-label={name || wallet}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: `hsl(${hue},60%,35%)`,
        border: "3px solid rgba(153,69,255,0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.35,
        fontWeight: 700,
        color: "#fff",
        flexShrink: 0,
        boxShadow: "0 0 20px rgba(153,69,255,0.3)",
      }}
    >
      {initials}
    </div>
  );
}

// ── Skill Radar (SVG hexagonal) ───────────────────────────────────────────────
const SKILLS = [
  { labelKey: "skills.rust", value: 0.7 },
  { labelKey: "skills.anchor", value: 0.5 },
  { labelKey: "skills.frontend", value: 0.6 },
  { labelKey: "skills.defi", value: 0.4 },
  { labelKey: "skills.security", value: 0.3 },
  { labelKey: "skills.testing", value: 0.55 },
];

function SkillRadar({ t }: { t: ProfileT }) {
  const cx = 100,
    cy = 100,
    r = 70;
  const n = SKILLS.length;
  const angleStep = (2 * Math.PI) / n;
  const getPoint = (i: number, radius: number) => {
    const angle = i * angleStep - Math.PI / 2;
    return {
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
    };
  };

  const outerPoints = Array.from({ length: n }, (_, i) => getPoint(i, r));
  const dataPoints = SKILLS.map((s, i) => getPoint(i, r * s.value));

  const toPath = (pts: { x: number; y: number }[]) =>
    pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ") + "Z";

  return (
    <SpotlightCard className="rounded-2xl" spotlightColor="rgba(153, 69, 255, 0.2)">
      <div
        className="rounded-2xl p-5"
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border-subtle)",
        }}
      >
      <div className="flex items-center justify-between mb-4">
        <p
          className="text-sm font-semibold"
          style={{ color: "var(--text-primary)" }}
        >
          {t("skillRadar.title")}
        </p>
      </div>
      <div className="flex justify-center">
        <svg
          width="200"
          height="200"
          viewBox="0 0 200 200"
          aria-label={t("skillRadar.aria")}
        >
          {/* Grid rings */}
          {[0.25, 0.5, 0.75, 1].map((scale) => (
            <polygon
              key={scale}
              points={outerPoints
                .map((p) => {
                  const scaled = getPoint(
                    outerPoints.indexOf(p),
                    r * scale,
                  );
                  return `${scaled.x},${scaled.y}`;
                })
                .join(" ")}
              fill="none"
              stroke="var(--border-subtle)"
              strokeWidth="1"
            />
          ))}
          {/* Spokes */}
          {outerPoints.map((p, i) => (
            <line
              key={i}
              x1={cx}
              y1={cy}
              x2={p.x}
              y2={p.y}
              stroke="var(--border-subtle)"
              strokeWidth="1"
            />
          ))}
          {/* Data fill */}
          <path
            d={toPath(dataPoints)}
            fill="rgba(153,69,255,0.2)"
            stroke="rgba(153,69,255,0.7)"
            strokeWidth="2"
          />
          {/* Data dots */}
          {dataPoints.map((p, i) => (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r="4"
              fill="var(--solana-purple)"
            />
          ))}
          {/* Labels */}
          {SKILLS.map((s, i) => {
            const labelPt = getPoint(i, r + 18);
            return (
              <text
                key={s.labelKey}
                x={labelPt.x}
                y={labelPt.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="10"
                fill="var(--text-muted)"
                fontFamily="system-ui"
              >
                {t(s.labelKey)}
              </text>
            );
          })}
        </svg>
      </div>
      </div>
    </SpotlightCard>
  );
}

// ── XP card ───────────────────────────────────────────────────────────────────
function XpCard({
  amount,
  localXp,
  isStub,
  t,
}: {
  amount: number;
  localXp: number;
  isStub: boolean;
  t: ProfileT;
}) {
  const displayAmount = isStub ? localXp : amount;
  const displayLevel = Math.floor(Math.sqrt(displayAmount / 100));
  const nextLevelXp = Math.pow(displayLevel + 1, 2) * 100;
  const currentLevelXp = Math.pow(displayLevel, 2) * 100;
  const progress =
    displayLevel === 0
      ? (displayAmount / 100) * 100
      : ((displayAmount - currentLevelXp) / (nextLevelXp - currentLevelXp)) *
        100;

  return (
    <SpotlightCard className="rounded-2xl mb-6" spotlightColor="rgba(153, 69, 255, 0.24)">
      <div
        className="rounded-2xl p-6 relative overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, rgba(153,69,255,0.15) 0%, rgba(20,241,149,0.06) 100%)",
          border: "1px solid rgba(153,69,255,0.3)",
        }}
      >
      <div
        className="absolute -top-8 -right-8 w-32 h-32 rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(153,69,255,0.2) 0%, transparent 70%)",
        }}
        aria-hidden="true"
      />

      <div className="flex items-start justify-between mb-5 relative">
        <div>
          <p
            className="text-xs font-semibold uppercase tracking-wider mb-2"
            style={{ color: "var(--text-purple)" }}
          >
            {t("xp.total")}
          </p>
          <p
            className="text-5xl font-bold leading-none"
            style={{ color: "var(--text-primary)" }}
          >
            {displayAmount.toLocaleString("en-US")}
          </p>
          {isStub && amount > 0 && (
            <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>
              {t("xp.onchainLabel", { amount: amount.toLocaleString("en-US") })}
            </p>
          )}
        </div>
        <div
          className="text-right px-4 py-3 rounded-xl"
          style={{
            background: "rgba(153,69,255,0.15)",
            border: "1px solid rgba(153,69,255,0.25)",
          }}
        >
          <p
            className="text-xs font-semibold uppercase tracking-wider mb-1"
            style={{ color: "var(--text-purple)" }}
          >
            {t("xp.level")}
          </p>
          <p
            className="text-4xl font-bold leading-none"
            style={{ color: "var(--text-primary)" }}
          >
            {displayLevel}
          </p>
        </div>
      </div>

      <div className="relative">
        <div
          className="flex justify-between text-xs mb-2"
          style={{ color: "var(--text-muted)" }}
        >
          <span>{t("xp.levelShort", { level: displayLevel })}</span>
          <span>
            {t("xp.nextLevel", {
              next: displayLevel + 1,
              xp: nextLevelXp.toLocaleString("en-US"),
            })}
          </span>
        </div>
        <div
          className="h-2.5 rounded-full overflow-hidden"
          style={{ background: "rgba(0,0,0,0.3)" }}
        >
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${Math.min(progress, 100)}%`,
              background:
                "linear-gradient(90deg, var(--solana-purple), var(--solana-green))",
            }}
          />
        </div>
        <p
          className="text-xs mt-1.5 text-right"
          style={{ color: "var(--text-muted)" }}
        >
          {t("xp.progressToNext", { pct: Math.round(Math.min(progress, 100)) })}
        </p>
      </div>

      </div>
    </SpotlightCard>
  );
}

// ── Main profile page ─────────────────────────────────────────────────────────
export default function ProfilePage() {
  const routeParams = useParams();
  const locale = (routeParams?.locale as string) ?? "en";
  const t = useTranslations("Profile");
  const { isLoggedIn, isChecking, redirectToAuth } = useAuthGate();
  const { publicKey, connected } = useWallet();
  const { data: session } = useSession();
  const { data: xp, isLoading: xpLoading } = useXpBalance();
  const {
    data: allEnrollments,
    isLoading: enrollmentsLoading,
    error: enrollmentsError,
  } = useAllEnrollments();
  const { data: courses } = useCourses();
  const { data: credentials, isLoading: credentialsLoading } = useCredentials();
  const signingMode = useSigningMode();
  const localXp = useStubXp();

  const achievementStates = useAchievements();
  const walletStr = publicKey?.toBase58() ?? "";
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<UserProfile>(DEFAULT_PROFILE);
  const [publicUsername, setPublicUsername] = useState<string | null>(null);

  useEffect(() => {
    if (isChecking) return;
    if (!isLoggedIn) {
      redirectToAuth();
    }
  }, [isChecking, isLoggedIn, redirectToAuth]);

  // Load profile from localStorage once wallet available
  useEffect(() => {
    if (walletStr) {
      const timer = setTimeout(() => {
        const loaded = loadProfile(walletStr);
        const walletIdentity = getProfileBySubject({ kind: "wallet", id: walletStr });
        const merged =
          loaded.displayName.trim().length > 0 || !walletIdentity?.displayName
            ? loaded
            : { ...loaded, displayName: walletIdentity.displayName };

        if (merged.displayName !== loaded.displayName) {
          saveProfile(walletStr, merged);
        }
        setProfile(merged);
        setDraft(merged);
        const publishedUsername = publishPublicProfile(walletStr, merged);
        setPublicUsername(
          publishedUsername ?? getPublicProfileUsernameByWallet(walletStr),
        );
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [walletStr]);

  function startEdit() {
    setDraft({ ...profile });
    setEditing(true);
  }
  function cancelEdit() {
    setEditing(false);
  }
  function saveEdit() {
    if (walletStr) {
      const nextProfile = { ...draft, displayName: draft.displayName.trim() };
      saveProfile(walletStr, nextProfile);
      setProfile(nextProfile);
      setPublicUsername(publishPublicProfile(walletStr, nextProfile));

      upsertProfile(
        { kind: "wallet", id: walletStr },
        { displayName: nextProfile.displayName },
      );

      if (
        session?.providerAccountId &&
        (session.provider === "google" || session.provider === "github")
      ) {
        upsertProfile(
          {
            kind: "social",
            provider: session.provider,
            id: session.providerAccountId,
          },
          { displayName: nextProfile.displayName },
        );
      }
    }
    setEditing(false);
  }

  if (isChecking) {
    return <PageSkeleton />;
  }

  if (!isLoggedIn) {
    return null;
  }

  if (!connected) {
    return (
      <div className="mx-auto max-w-2xl px-4 sm:px-6 py-8 sm:py-10">
        <SpotlightCard className="rounded-2xl" spotlightColor="rgba(153, 69, 255, 0.2)">
          <div
            className="rounded-2xl py-20 text-center"
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <p
              className="text-lg font-medium mb-1"
              style={{ color: "var(--text-secondary)" }}
            >
              {t("empty.title")}
            </p>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              {t("empty.description")}
            </p>
          </div>
        </SpotlightCard>
      </div>
    );
  }

  if (xpLoading || enrollmentsLoading) {
    return <PageSkeleton />;
  }

  if (enrollmentsError) {
    return <ErrorBanner message={t("errors.enrollmentsLoad")} />;
  }

  const myEnrollments = (allEnrollments ?? []).filter((e) => {
    if (!publicKey || !courses) return false;
    return courses.some((c) => {
      try {
        const [pda] = getEnrollmentPda(c.courseId, publicKey as PublicKey);
        return pda.toBase58() === e.publicKey.toBase58();
      } catch {
        return false;
      }
    });
  });

  const walletShort = walletStr
    ? `${walletStr.slice(0, 6)}…${walletStr.slice(-6)}`
    : "";

  const displayName = profile.displayName || walletShort;

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-8 sm:py-10">
      {/* ── Profile header ───────────────────────────────────────────────── */}
      <SpotlightCard className="rounded-2xl mb-6" spotlightColor="rgba(153, 69, 255, 0.2)">
        <div
          className="rounded-2xl p-6 relative overflow-hidden"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border-subtle)",
          }}
        >
        {/* Background glow */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: "200px",
            height: "140px",
            background:
              "radial-gradient(circle, rgba(153,69,255,0.08) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        <div className="flex items-start gap-4 relative">
          <AvatarInitials
            wallet={walletStr}
            name={profile.displayName || undefined}
            size={72}
          />

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h1
                  className="text-2xl font-bold tracking-tight truncate"
                  style={{ color: "var(--text-primary)" }}
                >
                  {displayName}
                </h1>
                <p
                  className="text-xs font-mono mt-0.5"
                  style={{ color: "var(--text-muted)" }}
                  title={walletStr}
                >
                  {walletShort}
                </p>
                {profile.isPublic && publicUsername && (
                  <Link
                    href={`/${locale}/profile/${publicUsername}`}
                    prefetch={false}
                    className="inline-flex text-xs mt-1 underline"
                    style={{ color: "var(--text-purple)" }}
                  >
                    {`/${publicUsername}`}
                  </Link>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {/* Public/private badge */}
                <button
                  onClick={() => {
                    const updated = {
                      ...profile,
                      isPublic: !profile.isPublic,
                    };
                    setProfile(updated);
                    if (walletStr) {
                      saveProfile(walletStr, updated);
                      setPublicUsername(publishPublicProfile(walletStr, updated));
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-150"
                  style={{
                    background: profile.isPublic
                      ? "rgba(25,251,155,0.08)"
                      : "var(--bg-elevated)",
                    border: `1px solid ${profile.isPublic ? "rgba(25,251,155,0.3)" : "var(--border-subtle)"}`,
                    color: profile.isPublic
                      ? "var(--solana-green)"
                      : "var(--text-muted)",
                  }}
                  aria-label={t("visibility.aria", {
                    state: profile.isPublic
                      ? t("visibility.public")
                      : t("visibility.private"),
                  })}
                >
                  {profile.isPublic ? (
                    <Eye size={11} aria-hidden="true" />
                  ) : (
                    <EyeOff size={11} aria-hidden="true" />
                  )}
                  {profile.isPublic
                    ? t("visibility.public")
                    : t("visibility.private")}
                </button>

                {!editing && (
                  <button
                    onClick={startEdit}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-150"
                    style={{
                      background: "rgba(153,69,255,0.08)",
                      border: "1px solid rgba(153,69,255,0.2)",
                      color: "var(--text-purple)",
                    }}
                  >
                    <Edit3 size={11} aria-hidden="true" />
                    {t("actions.edit")}
                  </button>
                )}
              </div>
            </div>

            {/* Bio (display mode) */}
            {!editing && profile.bio && (
              <p
                className="text-sm mt-2 leading-relaxed"
                style={{ color: "var(--text-secondary)" }}
              >
                {profile.bio}
              </p>
            )}

            {/* Social links (display mode) */}
            {!editing && (
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                {profile.twitter && (
                  <a
                    href={`https://twitter.com/${profile.twitter}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs transition-colors duration-150"
                    style={{ color: "var(--text-muted)" }}
                    onMouseEnter={(e) =>
                      ((e.currentTarget as HTMLElement).style.color =
                        "var(--text-primary)")
                    }
                    onMouseLeave={(e) =>
                      ((e.currentTarget as HTMLElement).style.color =
                        "var(--text-muted)")
                    }
                  >
                    <Twitter size={12} aria-hidden="true" />@{profile.twitter}
                  </a>
                )}
                {profile.github && (
                  <a
                    href={`https://github.com/${profile.github}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs transition-colors duration-150"
                    style={{ color: "var(--text-muted)" }}
                    onMouseEnter={(e) =>
                      ((e.currentTarget as HTMLElement).style.color =
                        "var(--text-primary)")
                    }
                    onMouseLeave={(e) =>
                      ((e.currentTarget as HTMLElement).style.color =
                        "var(--text-muted)")
                    }
                  >
                    <Github size={12} aria-hidden="true" />
                    {profile.github}
                  </a>
                )}
                {profile.website && (
                  <a
                    href={profile.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs transition-colors duration-150"
                    style={{ color: "var(--text-muted)" }}
                    onMouseEnter={(e) =>
                      ((e.currentTarget as HTMLElement).style.color =
                        "var(--text-primary)")
                    }
                    onMouseLeave={(e) =>
                      ((e.currentTarget as HTMLElement).style.color =
                        "var(--text-muted)")
                    }
                  >
                    <Globe size={12} aria-hidden="true" />
                    {profile.website}
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Edit form ──────────────────────────────────────────────────── */}
        {editing && (
          <div
            className="mt-5 pt-5 space-y-3"
            style={{ borderTop: "1px solid var(--border-subtle)" }}
          >
            {[
              {
                key: "displayName" as keyof UserProfile,
                label: t("edit.displayNameLabel"),
                placeholder: t("edit.displayNamePlaceholder"),
                icon: null,
                prefix: null,
              },
              {
                key: "bio" as keyof UserProfile,
                label: t("edit.bioLabel"),
                placeholder: t("edit.bioPlaceholder"),
                icon: null,
                prefix: null,
              },
              {
                key: "twitter" as keyof UserProfile,
                label: t("edit.twitterLabel"),
                placeholder: t("edit.twitterPlaceholder"),
                icon: <Twitter size={13} />,
                prefix: "@",
              },
              {
                key: "github" as keyof UserProfile,
                label: t("edit.githubLabel"),
                placeholder: t("edit.githubPlaceholder"),
                icon: <Github size={13} />,
                prefix: null,
              },
              {
                key: "website" as keyof UserProfile,
                label: t("edit.websiteLabel"),
                placeholder: t("edit.websitePlaceholder"),
                icon: <Globe size={13} />,
                prefix: null,
              },
            ].map((field) => (
              <div key={field.key}>
                <label
                  className="text-xs font-medium block mb-1"
                  style={{ color: "var(--text-muted)" }}
                  htmlFor={`profile-${field.key}`}
                >
                  {field.label}
                </label>
                <div className="relative">
                  {field.prefix && (
                    <span
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-xs"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {field.prefix}
                    </span>
                  )}
                  <input
                    id={`profile-${field.key}`}
                    type="text"
                    value={(draft[field.key] as string) || ""}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, [field.key]: e.target.value }))
                    }
                    placeholder={field.placeholder}
                    className="w-full rounded-lg px-3 py-2 text-sm outline-none transition-all duration-150"
                    style={{
                      paddingLeft: field.prefix ? "1.5rem" : "0.75rem",
                      background: "var(--bg-elevated)",
                      border: "1px solid var(--border-default)",
                      color: "var(--text-primary)",
                    }}
                    onFocus={(e) =>
                      ((e.target as HTMLElement).style.borderColor =
                        "rgba(153,69,255,0.5)")
                    }
                    onBlur={(e) =>
                      ((e.target as HTMLElement).style.borderColor =
                        "var(--border-default)")
                    }
                  />
                </div>
              </div>
            ))}
            <div className="flex gap-2 pt-1">
              <button
                onClick={saveEdit}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-150"
                style={{
                  background: "var(--solana-purple)",
                  color: "#fff",
                  border: "none",
                }}
              >
                <Check size={14} aria-hidden="true" />
                {t("actions.save")}
              </button>
              <button
                onClick={cancelEdit}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150"
                style={{
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border-default)",
                  color: "var(--text-secondary)",
                }}
              >
                <X size={14} aria-hidden="true" />
                {t("actions.cancel")}
              </button>
            </div>
          </div>
        )}
        </div>
      </SpotlightCard>

      {/* ── XP card ────────────────────────────────────────────────────────── */}
      <XpCard
        amount={xp?.amount ?? 0}
        localXp={localXp}
        isStub={signingMode === "stub"}
        t={t}
      />

      {!xp?.ataExists && signingMode !== "stub" && (
        <div
          className="rounded-xl p-4 mb-6 text-sm"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border-subtle)",
            color: "var(--text-muted)",
          }}
        >
          {t("xp.empty")}
        </div>
      )}

      {/* ── Skill radar + Credentials grid ─────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <SkillRadar t={t} />

        {/* Credentials */}
        <div
          className="rounded-2xl p-5"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border-subtle)",
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2
              className="text-sm font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              {t("credentials.title")}
            </h2>
            <Lock size={13} style={{ color: "var(--text-muted)" }} aria-hidden="true" />
          </div>
          {credentialsLoading ? (
            <div className="grid grid-cols-2 gap-3">
              {[0, 1].map((i) => (
                <div
                  key={i}
                  className="rounded-xl aspect-square skeleton-shimmer"
                  style={{ background: "var(--bg-elevated)" }}
                  aria-hidden="true"
                />
              ))}
            </div>
          ) : !credentials || credentials.length === 0 ? (
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              {t("credentials.empty")}
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {credentials.map((cred) => (
                <CredentialCard
                  key={cred.id}
                  credential={cred}
                  locale={locale}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Achievements ─────────────────────────────────────────────────────── */}
      <div
        className="rounded-2xl p-6 mb-8"
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border-subtle)",
        }}
      >
        <div className="flex items-center justify-between mb-5">
          <h2
            className="text-base font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            {t("achievements.title")}
          </h2>
          <span
            className="text-xs px-2 py-0.5 rounded-full"
            style={{
              color: "var(--text-muted)",
              background: "var(--bg-elevated)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            {achievementStates.filter((s) => s.earned).length} / {achievementStates.length}
          </span>
        </div>
        <AchievementGrid states={achievementStates} />
      </div>

      {/* ── Enrollments ────────────────────────────────────────────────────── */}
      <div>
        <h2
          className="text-base font-semibold mb-3"
          style={{ color: "var(--text-primary)" }}
        >
          {t("progress.title")}
        </h2>
        {myEnrollments.length === 0 ? (
          <div className="text-sm" style={{ color: "var(--text-muted)" }}>
            {t("progress.empty")}{" "}
            <Link
              href={`/${locale}/courses`}
              prefetch={false}
              className="underline transition-colors duration-150"
              style={{ color: "var(--text-purple)" }}
            >
              {t("progress.browseCta")}
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {myEnrollments.map((enrollment) => {
              const course = courses?.find(
                (c) => c.publicKey.toBase58() === enrollment.course.toBase58(),
              );
              const flags = normalizeFlags(enrollment.lessonFlags);
              const completed = countCompletedLessons(flags);
              const total = course?.lessonCount ?? 0;
              const isFinalized = !!enrollment.completedAt;
              const pct = total > 0 ? (completed / total) * 100 : 0;

              return (
                <Link
                  key={enrollment.publicKey.toBase58()}
                  href={`/${locale}/courses/${course?.courseId ?? enrollment.course.toBase58()}`}
                  prefetch={false}
                  className="block rounded-xl p-4 transition-all duration-150"
                  style={{
                    background: "var(--bg-surface)",
                    border: "1px solid var(--border-subtle)",
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.borderColor = "var(--border-purple)";
                    el.style.transform = "translateY(-1px)";
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.borderColor = "var(--border-subtle)";
                    el.style.transform = "translateY(0)";
                  }}
                >
                  <div className="flex items-center justify-between mb-2.5">
                    <span
                      className="font-medium text-sm"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {course?.courseId ??
                        enrollment.course.toBase58().slice(0, 8) + "…"}
                    </span>
                    {isFinalized ? (
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{
                          color: "var(--solana-green)",
                          background: "rgba(20,241,149,0.1)",
                          border: "1px solid rgba(20,241,149,0.25)",
                        }}
                      >
                        {t("progress.completed")}
                      </span>
                    ) : (
                      <span
                        className="text-xs"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {t("progress.lessonsCount", { completed, total })}
                      </span>
                    )}
                  </div>
                  {!isFinalized && total > 0 && (
                    <div
                      className="h-1.5 rounded-full overflow-hidden"
                      style={{ background: "var(--bg-elevated)" }}
                    >
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${pct}%`,
                          background:
                            "linear-gradient(90deg, var(--solana-purple), var(--solana-green))",
                        }}
                      />
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
