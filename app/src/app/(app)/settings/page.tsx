"use client";

import { useI18n } from "@/components/providers/I18nProvider";
import { useAuth } from "@/components/providers/AuthProvider";
import { useTheme } from "next-themes";
import { LOCALES, type Locale } from "@/lib/i18n";
import { useEffect, useState } from "react";
import Link from "next/link";
import { WalletButton } from "@/components/wallet/WalletButton";
import { createClient } from "@/lib/supabase/client";

interface LinkedWallet {
  id: string;
  wallet_address: string;
  is_primary: boolean;
  label: string | null;
  created_at: string;
}

export default function SettingsPage() {
  const { t, locale, setLocale } = useI18n();
  const { user, loading: authLoading } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();
  const [linkedWallets, setLinkedWallets] = useState<LinkedWallet[]>([]);

  const [emailNotifs, setEmailNotifs] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(true);
  const [publicProfile, setPublicProfile] = useState(true);
  const [showLeaderboard, setShowLeaderboard] = useState(true);

  // Fetch linked wallets and settings
  useEffect(() => {
    if (!user) return;

    const currentUser = user;

    async function fetchData() {
      const supabase = createClient();

      const [walletsRes, profileRes] = await Promise.all([
        supabase
          .from("linked_wallets")
          .select("id, wallet_address, is_primary, label, created_at")
          .eq("user_id", currentUser.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("profiles")
          .select("is_public, preferences")
          .eq("id", currentUser.id)
          .single(),
      ]);

      setLinkedWallets(walletsRes.data || []);

      if (profileRes.data) {
        setPublicProfile(profileRes.data.is_public !== false);
        const prefs = (profileRes.data.preferences as Record<string, boolean> | null) || {};
        setEmailNotifs(prefs.email_notifications !== false);
        setWeeklyDigest(prefs.weekly_digest !== false);
        setShowLeaderboard(prefs.show_leaderboard !== false);
      }
    }

    fetchData();
  }, [user]);

  const persistPreference = async (key: string, value: boolean) => {
    if (!user) return;
    const supabase = createClient();

    if (key === "is_public") {
      await supabase.from("profiles").update({ is_public: value }).eq("id", user.id);
    } else {
      // Store notification/leaderboard prefs in a JSON preferences column
      const { data: profile } = await supabase
        .from("profiles")
        .select("preferences")
        .eq("id", user.id)
        .single();

      const currentPrefs = (profile?.preferences as Record<string, boolean> | null) || {};
      const updatedPrefs = { ...currentPrefs, [key]: value };
      await supabase.from("profiles").update({ preferences: updatedPrefs }).eq("id", user.id);
    }
  };

  const handlePublicProfile = (v: boolean) => {
    setPublicProfile(v);
    persistPreference("is_public", v);
  };

  const handleShowLeaderboard = (v: boolean) => {
    setShowLeaderboard(v);
    persistPreference("show_leaderboard", v);
  };

  const handleEmailNotifs = (v: boolean) => {
    setEmailNotifs(v);
    persistPreference("email_notifications", v);
  };

  const handleWeeklyDigest = (v: boolean) => {
    setWeeklyDigest(v);
    persistPreference("weekly_digest", v);
  };

  const handleSetPrimary = async (walletId: string) => {
    if (!user) return;
    const supabase = createClient();
    
    // Remove primary from all wallets
    await supabase
      .from("linked_wallets")
      .update({ is_primary: false })
      .eq("user_id", user.id);
    
    // Set new primary
    await supabase
      .from("linked_wallets")
      .update({ is_primary: true })
      .eq("id", walletId);
    
    // Refresh list
    const { data } = await supabase
      .from("linked_wallets")
      .select("id, wallet_address, is_primary, label, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    
    setLinkedWallets(data || []);
  };

  const handleRemoveWallet = async (walletId: string) => {
    if (!user) return;
    const supabase = createClient();
    
    await supabase
      .from("linked_wallets")
      .delete()
      .eq("id", walletId);
    
    // Refresh list
    const { data } = await supabase
      .from("linked_wallets")
      .select("id, wallet_address, is_primary, label, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    
    setLinkedWallets(data || []);
  };

  if (authLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-neutral-300 dark:border-neutral-600 border-t-neutral-900 dark:border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6">
        <h1 className="text-2xl font-semibold">{t("common.signIn")} to access settings</h1>
        <Link href="/auth/sign-in" className="px-6 py-3 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-full text-sm font-semibold hover:bg-neutral-700 dark:hover:bg-neutral-200 transition-all">
          {t("common.signIn")}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto space-y-8 animate-fade-in">
      <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">{t("settings.title")}</h1>

      {/* Connected Accounts */}
      <section className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-6">
        <h2 className="text-lg font-semibold">Connected Accounts</h2>
        
        {/* Email Account */}
        <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="16" x="2" y="4" rx="2"/>
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                </svg>
              </div>
              <div>
                <p className="font-medium">Email</p>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">{user.email}</p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-[10px] font-semibold">
              Active
            </span>
          </div>
        </div>

        {/* Wallet Connection */}
        <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#9945FF] to-[#14F195] flex items-center justify-center text-white">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/>
                  <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/>
                </svg>
              </div>
              <div>
                <p className="font-medium">Solana Wallet</p>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  {linkedWallets.length > 0 
                    ? `${linkedWallets.length} wallet(s) connected` 
                    : "No wallet connected"}
                </p>
              </div>
            </div>
            <WalletButton />
          </div>

          {/* Linked Wallets List */}
          {linkedWallets.length > 0 && (
            <div className="mt-4 space-y-2 border-t border-neutral-200 dark:border-neutral-700 pt-4">
              <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">Linked Wallets</p>
              {linkedWallets.map((wallet) => (
                <div key={wallet.id} className={`flex items-center justify-between p-3 rounded-lg ${wallet.is_primary ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' : 'bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700'}`}>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm">
                      {wallet.wallet_address.slice(0, 6)}...{wallet.wallet_address.slice(-4)}
                    </span>
                    {wallet.is_primary && (
                      <span className="px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-[10px] font-semibold">
                        Primary
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {!wallet.is_primary && (
                      <button
                        onClick={() => handleSetPrimary(wallet.id)}
                        className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Set Primary
                      </button>
                    )}
                    <button
                      onClick={() => handleRemoveWallet(wallet.id)}
                      className="text-[10px] text-red-600 dark:text-red-400 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <p className="text-xs text-neutral-400 mt-3">
            Linking a wallet is required to receive on-chain credentials and track XP on the blockchain.
          </p>
        </div>
      </section>

      {/* Appearance */}
      <section className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-6">
        <h2 className="text-lg font-semibold">{t("settings.appearance")}</h2>

        {/* Theme */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-neutral-600 dark:text-neutral-400">{t("settings.theme")}</label>
          <div className="flex gap-2">
            {(["light", "dark", "system"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setTheme(mode)}
                className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                  (resolvedTheme ?? "light") === mode
                    ? "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900"
                    : "border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:border-neutral-400 dark:hover:border-neutral-500"
                }`}
              >
                {mode === "light" ? t("settings.light") : mode === "dark" ? t("settings.dark") : t("settings.system")}
              </button>
            ))}
          </div>
        </div>

        {/* Language */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-neutral-600 dark:text-neutral-400">{t("settings.language")}</label>
          <div className="flex gap-2 flex-wrap">
            {LOCALES.map((l) => (
              <button
                key={l.code}
                onClick={() => setLocale(l.code as Locale)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                  locale === l.code
                    ? "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900"
                    : "border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:border-neutral-400 dark:hover:border-neutral-500"
                }`}
              >
                <span>{l.flag}</span>
                {l.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Notifications */}
      <section className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-5">
        <h2 className="text-lg font-semibold">{t("settings.notifications")}</h2>
        <ToggleRow
          title={t("settings.emailNotifs")}
          description={t("settings.emailNotifsDesc")}
          checked={emailNotifs}
          onChange={handleEmailNotifs}
        />
        <ToggleRow
          title={t("settings.weeklyDigest")}
          description={t("settings.weeklyDigestDesc")}
          checked={weeklyDigest}
          onChange={handleWeeklyDigest}
        />
      </section>

      {/* Privacy */}
      <section className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-5">
        <h2 className="text-lg font-semibold">{t("settings.privacy")}</h2>
        <ToggleRow
          title={t("settings.publicProfile")}
          description={t("settings.publicProfileDesc")}
          checked={publicProfile}
          onChange={handlePublicProfile}
        />
        <ToggleRow
          title={t("settings.showLeaderboard")}
          description={t("settings.showLeaderboardDesc")}
          checked={showLeaderboard}
          onChange={handleShowLeaderboard}
        />
      </section>

      {/* Danger Zone */}
      <section className="p-6 rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20 space-y-4">
        <h2 className="text-lg font-semibold text-red-700 dark:text-red-400">{t("settings.dangerZone")}</h2>
        <div className="flex gap-3 flex-wrap">
          <button className="px-4 py-2 rounded-full border border-red-200 dark:border-red-800 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors">
            {t("settings.exportData")}
          </button>
          <button className="px-4 py-2 rounded-full border border-red-300 dark:border-red-800 bg-red-100 dark:bg-red-950/50 text-xs font-semibold text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-950 transition-colors">
            {t("settings.deleteAccount")}
          </button>
        </div>
      </section>
    </div>
  );
}

/* Toggle Switch Row */
function ToggleRow({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{description}</p>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
          checked ? "bg-neutral-900 dark:bg-white" : "bg-neutral-200 dark:bg-neutral-700"
        }`}
        role="switch"
        aria-checked={checked}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white dark:bg-neutral-900 shadow transition-transform ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}
