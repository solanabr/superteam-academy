import { getTranslations } from "next-intl/server";
import { getProfileByUsername } from "@/lib/supabase";
import { getCredentials, getAchievements } from "@/services/credentials";
import { CredentialCard } from "@/components/solana/CredentialCard";
import { LevelBadge } from "@/components/gamification/LevelBadge";
import { SkillRadar } from "@/components/profile/SkillRadar";
import { VisibilityToggle } from "@/components/profile/VisibilityToggle";
import { xpToLevel } from "@/types";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ locale: string; username: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  return { title: `${username} · Academy Profile` };
}

export default async function ProfilePage({ params }: Props) {
  const { username } = await params;
  const t = await getTranslations("profile");

  const profile = await getProfileByUsername(username).catch(() => null);

  if (!profile) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <p className="font-mono text-[#666666]">Profile not found</p>
      </div>
    );
  }

  const [credentials, achievements] = await Promise.all([
    profile.walletAddress ? getCredentials(profile.walletAddress) : [],
    profile.walletAddress ? getAchievements(profile.walletAddress) : [],
  ]);

  const totalXp = credentials.reduce(
    (sum, c) => sum + Number(c.attributes.totalXp ?? 0),
    0
  );
  const level = xpToLevel(totalXp);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      {/* Profile header */}
      <div className="flex items-start gap-5 mb-8">
        <div className="w-16 h-16 rounded-full bg-[#1A1A1A] border border-[#1F1F1F] flex items-center justify-center font-mono text-2xl flex-shrink-0">
          {(profile.displayName ?? profile.username ?? "?")[0].toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="font-mono text-2xl font-bold text-[#EDEDED]">
              {profile.displayName ?? profile.username ?? username}
            </h1>
            <LevelBadge level={level} />
            <VisibilityToggle />
          </div>
          {profile.username && (
            <p className="text-sm text-[#666666] font-mono">@{profile.username}</p>
          )}
          {profile.bio && (
            <p className="text-sm text-[#666666] mt-2 max-w-xl">{profile.bio}</p>
          )}
          <div className="flex flex-wrap gap-4 mt-3 text-xs font-mono text-[#666666]">
            {profile.walletAddress && (
              <span>
                ◎ {profile.walletAddress.slice(0, 6)}...{profile.walletAddress.slice(-4)}
              </span>
            )}
            <span>Joined {new Date(profile.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {[
          { label: "Total XP", value: totalXp.toLocaleString() },
          { label: "Credentials", value: credentials.length.toString() },
          { label: "Achievements", value: achievements.length.toString() },
        ].map(({ label, value }) => (
          <div key={label} className="bg-[#111111] border border-[#1F1F1F] rounded p-4 text-center">
            <div className="font-mono text-2xl font-bold text-[#EDEDED]">{value}</div>
            <div className="text-[10px] text-[#666666] font-mono mt-0.5 uppercase tracking-wider">
              {label}
            </div>
          </div>
        ))}
      </div>

      {/* Skills */}
      <section className="mb-8">
        <h2 className="font-mono text-lg font-semibold text-[#EDEDED] mb-4">
          Skills
        </h2>
        <SkillRadar />
      </section>

      {/* Credentials */}
      <section className="mb-8">
        <h2 className="font-mono text-lg font-semibold text-[#EDEDED] mb-4">
          {t("credentials")}
        </h2>
        {credentials.length === 0 ? (
          <p className="text-sm text-[#666666] font-mono">{t("noCredentials")}</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {credentials.map((cred) => (
              <CredentialCard key={cred.id} credential={cred} />
            ))}
          </div>
        )}
      </section>

      {/* Achievements */}
      {achievements.length > 0 && (
        <section>
          <h2 className="font-mono text-lg font-semibold text-[#EDEDED] mb-4">
            {t("achievements")}
          </h2>
          <div className="flex flex-wrap gap-2">
            {achievements.map((ach) => (
              <div
                key={ach.id}
                className="bg-[#111111] border border-[#1F1F1F] rounded px-3 py-2 flex items-center gap-2"
              >
                <span className="text-sm">🏆</span>
                <span className="text-xs font-mono text-[#EDEDED]">{ach.name}</span>
                <span className="text-[10px] font-mono text-[#14F195]">+{ach.xpReward} XP</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
