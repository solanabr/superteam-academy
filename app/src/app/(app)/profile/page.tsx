"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/providers/AuthProvider";
import { useI18n } from "@/components/providers/I18nProvider";
import { createClient } from "@/lib/supabase/client";
import { getLearningProgressService } from "@/lib/services/learning-progress";
import { getOnChainReadService } from "@/lib/services/onchain-read";
import { type UserXPSummary, type Credential, type Enrollment, xpToLevel } from "@/lib/types/learning";

interface LinkedWallet {
  id: string;
  wallet_address: string;
  is_primary: boolean;
  linked_at: string;
}

export default function ProfilePage() {
  const { user, profile, loading: authLoading, refreshProfile } = useAuth();
  const { t } = useI18n();
  const [wallets, setWallets] = useState<LinkedWallet[]>([]);
  const [xp, setXp] = useState<UserXPSummary | null>(null);
  const [onChainXP, setOnChainXP] = useState<number | null>(null);
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    display_name: "",
    username: "",
    bio: "",
    social_twitter: "",
    social_github: "",
    social_discord: "",
    social_website: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);

    const currentUser = user;
    const supabase = createClient();
    const learningService = getLearningProgressService();
    const onChainService = getOnChainReadService();

    async function fetchData() {
      try {
        // Fetch local data
        const [walletsRes, xpData, enrollmentsData] = await Promise.all([
          supabase.from("linked_wallets").select("*").eq("user_id", currentUser.id),
          learningService.getXP(currentUser.id),
          learningService.getEnrollments(currentUser.id),
        ]);

        const walletsData = (walletsRes.data as LinkedWallet[]) || [];
        setWallets(walletsData);
        setXp(xpData);
        setEnrollments(enrollmentsData);

        // Fetch on-chain data if wallet is linked
        const primaryWallet = walletsData.find((w) => w.is_primary);
        if (primaryWallet) {
          try {
            const [xpBalance, creds] = await Promise.all([
              onChainService.getXPBalance(primaryWallet.wallet_address),
              onChainService.getCredentials(primaryWallet.wallet_address),
            ]);
            setOnChainXP(xpBalance);
            setCredentials(creds);
          } catch (error) {
            console.error("Error fetching on-chain data:", error);
          }
        }
      } catch (error) {
        console.error("Error fetching profile data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [user]);

  useEffect(() => {
    if (profile) {
      setFormData({
        display_name: profile.display_name || "",
        username: profile.username || "",
        bio: profile.bio || "",
        social_twitter: profile.social_twitter || "",
        social_github: profile.social_github || "",
        social_discord: profile.social_discord || "",
        social_website: profile.social_website || "",
      });
    }
  }, [profile]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const supabase = createClient();
      await supabase
        .from("profiles")
        .update({
          display_name: formData.display_name || null,
          username: formData.username || null,
          bio: formData.bio || null,
          social_twitter: formData.social_twitter || null,
          social_github: formData.social_github || null,
          social_discord: formData.social_discord || null,
          social_website: formData.social_website || null,
        })
        .eq("id", user.id);

      await refreshProfile();
      setEditing(false);
    } catch (err) {
      console.error("Failed to save profile:", err);
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-neutral-300 dark:border-neutral-600 border-t-neutral-900 dark:border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6">
        <h1 className="text-2xl font-semibold">{t("profile.signInPrompt")}</h1>
        <Link href="/auth/sign-in" className="px-6 py-3 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-full text-sm font-semibold hover:bg-neutral-700 dark:hover:bg-neutral-200 transition-all">
          {t("common.signIn")}
        </Link>
      </div>
    );
  }

  const effectiveXP = onChainXP ?? xp?.totalXp ?? 0;
  const effectiveLevel = xpToLevel(effectiveXP);
  const primaryWallet = wallets.find((w) => w.is_primary);

  return (
    <div className="mx-auto space-y-8 animate-fade-in">
      <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">{t("profile.title")}</h1>

      {/* Profile Card */}
      <div className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-neutral-900 dark:bg-white flex items-center justify-center text-white dark:text-neutral-900 text-xl font-bold flex-shrink-0">
            {(profile?.display_name || user.email || "U").charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-semibold truncate">
              {profile?.display_name || user.email?.split("@")[0] || "Learner"}
            </h2>
            {profile?.username && (
              <p className="text-sm text-neutral-400">@{profile.username}</p>
            )}
            <p className="text-xs text-neutral-400 mt-0.5">{user.email}</p>
          </div>
          <button
            onClick={() => setEditing(!editing)}
            className="px-4 py-2 rounded-full border border-neutral-200 dark:border-neutral-700 text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:border-neutral-400 dark:hover:border-neutral-500 transition-colors"
          >
            {editing ? t("common.cancel") : t("common.edit")}
          </button>
        </div>

        {/* Quick Stats */}
        <div className="flex flex-wrap gap-6 text-sm">
          <div>
            <span className="text-neutral-400">{t("dashboard.level")}</span>
            <p className="font-semibold text-lg">{effectiveLevel}</p>
          </div>
          <div>
            <span className="text-neutral-400">XP</span>
            <p className="font-semibold text-lg">{effectiveXP.toLocaleString()}</p>
            {onChainXP !== null && (
              <span className="text-[10px] text-green-600 dark:text-green-400">On-chain</span>
            )}
          </div>
          <div>
            <span className="text-neutral-400">{t("leaderboard.streak")}</span>
            <p className="font-semibold text-lg">{xp?.currentStreak || 0} {t("dashboard.days")}</p>
          </div>
          <div>
            <span className="text-neutral-400">Credentials</span>
            <p className="font-semibold text-lg">{credentials.length}</p>
          </div>
        </div>

        {/* Edit Form */}
        {editing && (
          <div className="space-y-4 pt-4 border-t border-neutral-100 dark:border-neutral-800">
            <div className="grid md:grid-cols-2 gap-4">
              <FieldInput label={t("profile.displayName")} value={formData.display_name} onChange={(v) => setFormData({ ...formData, display_name: v })} />
              <FieldInput label={t("profile.username")} value={formData.username} onChange={(v) => setFormData({ ...formData, username: v })} placeholder="@username" />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1.5">{t("profile.bio")}</label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/10 dark:focus:ring-white/10 focus:border-neutral-400 dark:focus:border-neutral-500 transition-all resize-none h-20"
                placeholder={t("profile.bioPlaceholder")}
              />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <FieldInput label={t("profile.twitter")} value={formData.social_twitter} onChange={(v) => setFormData({ ...formData, social_twitter: v })} placeholder="@handle" />
              <FieldInput label={t("profile.github")} value={formData.social_github} onChange={(v) => setFormData({ ...formData, social_github: v })} placeholder="username" />
              <FieldInput label={t("profile.discord")} value={formData.social_discord} onChange={(v) => setFormData({ ...formData, social_discord: v })} placeholder="user#0000" />
              <FieldInput label={t("profile.website")} value={formData.social_website} onChange={(v) => setFormData({ ...formData, social_website: v })} placeholder="https://..." />
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-full text-xs font-semibold hover:bg-neutral-700 dark:hover:bg-neutral-200 transition-all disabled:opacity-50"
            >
              {saving ? t("common.saving") : t("common.save")}
            </button>
          </div>
        )}
      </div>

      {/* Linked Wallets */}
      <div className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">{t("profile.linkedWallets")}</h2>
          {primaryWallet && onChainXP !== null && (
            <span className="text-xs text-green-600 dark:text-green-400">
              {onChainXP.toLocaleString()} XP on-chain
            </span>
          )}
        </div>
        {wallets.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-sm text-neutral-400 mb-3">
              {t("profile.noWallets")}
            </p>
            <Link 
              href="/settings" 
              className="px-4 py-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-full text-xs font-semibold hover:bg-neutral-700 dark:hover:bg-neutral-200 transition-all"
            >
              Link Wallet
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {wallets.map((w) => (
              <div key={w.id} className={`flex items-center justify-between p-3 rounded-xl border ${w.is_primary ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-neutral-50 dark:bg-neutral-800/50 border-neutral-100 dark:border-neutral-700'}`}>
                <div>
                  <p className="text-sm font-mono font-medium text-neutral-700 dark:text-neutral-300">
                    {w.wallet_address.slice(0, 6)}...{w.wallet_address.slice(-4)}
                  </p>
                  <p className="text-[10px] text-neutral-400 mt-0.5">
                    {t("profile.walletLinked", { date: new Date(w.linked_at).toLocaleDateString() })}
                    {w.is_primary && (
                      <span className="ml-2 text-green-600 dark:text-green-400 font-medium">Primary</span>
                    )}
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 text-[10px] font-semibold border border-emerald-200 dark:border-emerald-800">
                  {t("profile.active")}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* On-Chain Credentials */}
      <div className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">{t("profile.credentials")}</h2>
          {credentials.length > 0 && (
            <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full">
              Verified on-chain
            </span>
          )}
        </div>
        <p className="text-sm text-neutral-400 mb-4">
          {t("profile.credentialsDesc")}
        </p>
        
        {credentials.length === 0 ? (
          <div className="p-8 rounded-xl border border-dashed border-neutral-300 dark:border-neutral-700 text-center">
            <div className="text-4xl mb-2">🏆</div>
            <p className="text-neutral-500 dark:text-neutral-400 text-sm mb-2">{t("profile.noCredentials")}</p>
            <p className="text-xs text-neutral-400">Complete courses to earn on-chain credentials</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {credentials.map((credential) => (
              <div key={credential.mintAddress} className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50 hover:border-neutral-300 dark:hover:border-neutral-600 transition-all group">
                <div className="aspect-square rounded-lg bg-gradient-to-br from-neutral-200 to-neutral-300 dark:from-neutral-700 dark:to-neutral-600 mb-3 overflow-hidden">
                  {credential.imageUrl ? (
                    // External NFT/media URLs are dynamic and may not fit Next/Image host allowlist.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img 
                      src={credential.imageUrl} 
                      alt={credential.trackName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl">🏆</div>
                  )}
                </div>
                <p className="text-sm font-medium truncate">{credential.trackName}</p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">Level {credential.level}</p>
                <a 
                  href={credential.verifyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline mt-2 inline-flex items-center gap-1"
                >
                  Verify
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Skills */}
      <div className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
        <h2 className="text-lg font-semibold mb-4">Skills</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {deriveSkills(enrollments).map((skill) => (
            <div key={skill.name} className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-700">
              <p className="text-sm font-medium">{skill.name}</p>
              <div className="mt-2 h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-neutral-900 dark:bg-white rounded-full transition-all"
                  style={{ width: `${skill.level}%` }}
                />
              </div>
              <p className="text-xs text-neutral-400 mt-1">{skill.level}%</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function deriveSkills(enrollments: Enrollment[]): Array<{ name: string; level: number }> {
  const SKILL_KEYWORDS: Record<string, string[]> = {
    Rust: ["rust", "solana basics", "program"],
    Anchor: ["anchor", "framework", "pda"],
    Frontend: ["frontend", "react", "next", "web", "ui", "dapp"],
    Security: ["security", "audit", "vulnerability", "exploit"],
  };

  const skills = Object.entries(SKILL_KEYWORDS).map(([name, keywords]) => {
    if (enrollments.length === 0) return { name, level: 0 };

    const matched = enrollments.filter((e) => {
      const title = (e.courseTitle || "").toLowerCase();
      return keywords.some((kw) => title.includes(kw));
    });

    if (matched.length === 0) {
      // Distribute general progress evenly if no keyword match
      const totalProgress = enrollments.reduce((sum, e) => sum + e.completionPercent, 0);
      const avg = enrollments.length > 0 ? Math.round(totalProgress / enrollments.length / 4) : 0;
      return { name, level: Math.min(avg, 100) };
    }

    const avgProgress = Math.round(
      matched.reduce((sum, e) => sum + e.completionPercent, 0) / matched.length
    );
    return { name, level: Math.min(avgProgress, 100) };
  });

  return skills;
}

function FieldInput({ label, value, onChange, placeholder }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1.5">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/10 dark:focus:ring-white/10 focus:border-neutral-400 dark:focus:border-neutral-500 transition-all"
      />
    </div>
  );
}
