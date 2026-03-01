"use client";

import { AchievementCard } from "@/components/gamification/achievement-card";
import { Badge } from "@/components/ui/badge";
import { mockAchievements, mockCourses } from "@/lib/data/mock-courses";
import { credentialService } from "@/lib/services/credential-service";
import { useUserStore } from "@/lib/store/user-store";
import { useOnChainXp } from "@/hooks/use-on-chain";
import { levelFromXp } from "@/lib/solana/constants";
import type { Credential, UserProfile } from "@/types";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { ExternalLink, Loader2, Wallet } from "lucide-react";

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const storeProfile = useUserStore((state) => state.profile);
  const enrollments = useUserStore((state) => state.enrollments);
  const completedLessons = useUserStore((state) => state.completedLessons);
  const walletAddress = useUserStore((state) => state.walletAddress);
  const wallet = useWallet();

  const isCurrentUser = username === "you" || username === storeProfile.username;
  const { data: onChainXp } = useOnChainXp(
    isCurrentUser ? walletAddress ?? undefined : undefined,
  );

  const profile: UserProfile | undefined = useMemo(() => {
    if (isCurrentUser) {
      const xp = onChainXp ?? storeProfile.xp;
      return {
        ...storeProfile,
        xp,
        level: levelFromXp(xp),
        enrolledCourseIds: enrollments,
      };
    }
    return undefined;
  }, [isCurrentUser, storeProfile, enrollments, onChainXp]);

  const enrolledCourses = useMemo(
    () => mockCourses.filter((course) => profile?.enrolledCourseIds.includes(course.id)),
    [profile],
  );

  const totalLessonsCompleted = useMemo(
    () => Object.values(completedLessons).reduce((sum, ids) => sum + ids.length, 0),
    [completedLessons],
  );

  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [credLoading, setCredLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!walletAddress || !isCurrentUser) return;
    let active = true;
    setCredLoading(true);
    credentialService
      .getCredentialsByWallet(walletAddress)
      .then((creds) => { if (active) setCredentials(creds); })
      .finally(() => { if (active) setCredLoading(false); });
    return () => { active = false; };
  }, [walletAddress, isCurrentUser]);

  if (isCurrentUser && !wallet.connected) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 text-center">
        <div className="rounded-2xl border border-border bg-card p-8">
          <Wallet className="mx-auto mb-4 size-12 text-muted-foreground" />
          <h1 className="text-2xl font-semibold text-foreground">Connect your wallet</h1>
          <p className="mt-2 max-w-md text-muted-foreground">
            Connect your Solana wallet to view your profile, achievements, and credentials.
          </p>
          {mounted && (
            <div className="mt-6">
              <WalletMultiButton className="rounded-lg! bg-gradient-cta! px-6! py-2! text-cta-foreground!" />
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-muted-foreground">Profile not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-start gap-4">
          <div className="flex size-20 items-center justify-center rounded-full border-2 border-border bg-surface text-xl font-bold text-foreground">
            {profile.displayName.slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-semibold text-foreground">{profile.displayName}</h1>
            <p className="mt-1 text-sm text-muted-foreground">@{profile.username}</p>
            <p className="mt-2 max-w-2xl text-muted-foreground">{profile.bio}</p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {profile.interests.map((interest) => (
            <Badge key={interest} variant="outline" className="border-border text-muted-foreground">{interest}</Badge>
          ))}
        </div>
        {isCurrentUser && (
          <div className="mt-4 grid grid-cols-3 gap-4 rounded-lg border border-border bg-background/50 p-3">
            <Stat label="XP" value={profile.xp.toLocaleString()} />
            <Stat label="Level" value={`${profile.level}`} />
            <Stat label="Lessons done" value={`${totalLessonsCompleted}`} />
          </div>
        )}
        {walletAddress && isCurrentUser && (
          <p className="mt-3 font-mono text-xs text-muted-foreground">
            {walletAddress.slice(0, 4)}...{walletAddress.slice(-4)}
          </p>
        )}
      </header>

      <section className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <article className="rounded-xl border border-border bg-card p-4">
          <h2 className="mb-3 text-sm font-semibold text-foreground">Skill radar</h2>
          <RadarChart values={profile.skills} />
        </article>
        <article className="rounded-xl border border-border bg-card p-4">
          <h2 className="mb-3 text-sm font-semibold text-foreground">Enrolled courses ({enrolledCourses.length})</h2>
          {enrolledCourses.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No courses enrolled yet.{" "}
              <Link href="/courses" className="text-st-yellow hover:underline">Browse courses</Link>
            </p>
          ) : (
            <ul className="space-y-2 text-sm text-muted-foreground">
              {enrolledCourses.map((course) => {
                const done = completedLessons[course.id]?.length ?? 0;
                const total = course.modules.reduce((s, m) => s + m.lessons.length, 0);
                return (
                  <li key={course.id} className="flex items-center justify-between">
                    <Link href={`/courses/${course.slug}`} className="hover:text-st-yellow">{course.title}</Link>
                    <span className="text-xs">{done}/{total}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </article>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">Achievements</h2>
        <div className="grid gap-3 md:grid-cols-3">
          {mockAchievements.map((achievement) => (
            <AchievementCard key={achievement.id} achievement={achievement} />
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">Credentials</h2>
        {credLoading ? (
          <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Loading credentials...
          </div>
        ) : credentials.length === 0 ? (
          <p className="py-4 text-sm text-muted-foreground">
            No credentials yet. Complete a course and finalize it to earn your first credential NFT.
          </p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {credentials.map((credential) => (
              <div
                key={credential.id}
                className="overflow-hidden rounded-xl border border-border bg-card transition hover:border-st-yellow/30"
              >
                <div className="flex h-44 items-center justify-center bg-linear-to-r from-st-green/20 to-st-yellow/20">
                  <span className="text-4xl">🏆</span>
                </div>
                <div className="flex items-center justify-between p-4">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{credential.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {credential.issuedAt ? new Date(credential.issuedAt).toLocaleDateString() : "On-chain credential"}
                    </p>
                  </div>
                  {credential.txSignature && (
                    <a
                      href={`https://explorer.solana.com/address/${credential.txSignature}?cluster=devnet`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-st-yellow hover:bg-st-yellow/10"
                    >
                      <ExternalLink className="size-3" />
                      Explorer
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <p className="text-lg font-semibold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function RadarChart({ values }: { values: Record<string, number> }) {
  const entries = Object.entries(values);
  if (entries.length === 0) {
    return <p className="py-4 text-center text-sm text-muted-foreground">No skills tracked yet.</p>;
  }
  const center = 110;
  const radius = 90;
  const points = entries
    .map(([, value], index) => {
      const angle = (Math.PI * 2 * index) / entries.length - Math.PI / 2;
      const scaled = (value / 100) * radius;
      return `${center + Math.cos(angle) * scaled},${center + Math.sin(angle) * scaled}`;
    })
    .join(" ");

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 220 220" className="h-56 w-56">
        {[0.25, 0.5, 0.75, 1].map((scale) => (
          <circle key={scale} cx={center} cy={center} r={radius * scale} fill="none" stroke="currentColor" className="text-border" />
        ))}
        <polygon points={points} fill="var(--highlight, rgba(255,210,63,0.22))" fillOpacity="0.22" stroke="var(--highlight)" strokeWidth="2" />
      </svg>
      <div className="grid w-full grid-cols-2 gap-2 text-xs text-muted-foreground">
        {entries.map(([name, value]) => (
          <p key={name}>{name}: {value}</p>
        ))}
      </div>
    </div>
  );
}
