"use client";

import { AchievementCard } from "@/components/gamification/achievement-card";
import { Badge } from "@/components/ui/badge";
import { mockAchievements, mockCourses, mockProfiles } from "@/lib/data/mock-courses";
import { achievementService } from "@/lib/services/achievement-service";
import { credentialService } from "@/lib/services/credential-service";
import { useUserStore } from "@/lib/store/user-store";
import type { Achievement, Credential, UserProfile } from "@/types";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Wallet } from "lucide-react";

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const storeProfile = useUserStore((state) => state.profile);
  const enrollments = useUserStore((state) => state.enrollments);
  const completedLessons = useUserStore((state) => state.completedLessons);
  const walletAddress = useUserStore((state) => state.walletAddress);

  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const wallet = useWallet();

  const isCurrentUser = username === "you" || username === storeProfile.username;

  if (isCurrentUser && !wallet.connected) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 text-center">
        <div className="rounded-2xl border border-border bg-card p-8">
          <Wallet className="mx-auto mb-4 size-12 text-muted-foreground" />
          <h1 className="text-2xl font-semibold text-foreground">Connect your wallet</h1>
          <p className="mt-2 max-w-md text-muted-foreground">
            Connect your Solana wallet to view your profile, achievements, and credentials.
          </p>
          <div className="mt-6">
            <WalletMultiButton className="!rounded-md !bg-gradient-to-r !from-[#2f6b3f] !to-[#ffd23f] !px-6 !py-2 !text-st-dark" />
          </div>
        </div>
      </div>
    );
  }

  const profile: UserProfile | undefined = useMemo(() => {
    if (isCurrentUser) {
      return {
        ...storeProfile,
        enrolledCourseIds: enrollments,
      };
    }
    return mockProfiles.find((item) => item.username === username);
  }, [isCurrentUser, storeProfile, enrollments, username]);

  useEffect(() => {
    if (!profile) return;
    achievementService.listAchievements(profile.id).then(setAchievements);
    credentialService.getCredentialsByWallet(walletAddress ?? profile.walletAddress ?? "").then(setCredentials);
  }, [profile, walletAddress]);

  const enrolledCourses = useMemo(
    () => mockCourses.filter((course) => profile?.enrolledCourseIds.includes(course.id)),
    [profile],
  );

  const totalLessonsCompleted = useMemo(
    () => Object.values(completedLessons).reduce((sum, ids) => sum + ids.length, 0),
    [completedLessons],
  );

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
          <Image
            src={profile.avatar}
            alt={profile.displayName}
            width={80}
            height={80}
            className="rounded-full border-2 border-border"
          />
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
            <p className="text-sm text-muted-foreground">No courses enrolled yet.</p>
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
          {achievements.map((achievement) => (
            <AchievementCard key={achievement.id} achievement={achievement} />
          ))}
        </div>
      </section>

      {credentials.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Credentials</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {credentials.map((credential) => (
              <Link
                key={credential.id}
                href={`/certificates/${credential.id}`}
                className="overflow-hidden rounded-xl border border-border bg-card"
              >
                <Image
                  src={credential.imageUri}
                  alt={credential.title}
                  width={600}
                  height={300}
                  className="h-44 w-full object-cover"
                />
                <div className="p-4">
                  <p className="text-sm font-semibold text-foreground">{credential.title}</p>
                  <p className="text-xs text-muted-foreground">Issued {new Date(credential.issuedAt).toLocaleDateString()}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
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
        <polygon points={points} fill="rgba(255,210,63,0.22)" stroke="#ffd23f" strokeWidth="2" />
      </svg>
      <div className="grid w-full grid-cols-2 gap-2 text-xs text-muted-foreground">
        {entries.map(([name, value]) => (
          <p key={name}>{name}: {value}</p>
        ))}
      </div>
    </div>
  );
}
