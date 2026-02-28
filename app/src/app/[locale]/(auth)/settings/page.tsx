"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { Check, Loader2, Globe, Palette, User, Link2, Bell } from "lucide-react";
import { upsertProfile } from "@/lib/supabase";

type SettingsTab = "profile" | "accounts" | "appearance" | "language" | "notifications";

const TABS: Array<{ id: SettingsTab; icon: typeof User; label: string }> = [
  { id: "profile", icon: User, label: "Profile" },
  { id: "accounts", icon: Link2, label: "Linked Accounts" },
  { id: "appearance", icon: Palette, label: "Appearance" },
  { id: "language", icon: Globe, label: "Language" },
  { id: "notifications", icon: Bell, label: "Notifications" },
];

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "pt-BR", label: "Português (Brasil)" },
  { value: "es", label: "Español" },
];

export default function SettingsPage() {
  const t = useTranslations("settings");
  const router = useRouter();
  const currentLocale = useLocale();
  const { publicKey, connected, disconnect } = useWallet();
  const { setVisible } = useWalletModal();

  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [activeTheme, setActiveTheme] = useState<"dark" | "light">("dark");
  const [twitterHandle, setTwitterHandle] = useState("");
  const [githubHandle, setGithubHandle] = useState("");
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [streakReminder, setStreakReminder] = useState(true);
  const [achievementNotifs, setAchievementNotifs] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "light" || saved === "dark") {
      setActiveTheme(saved);
    }
  }, []);

  const applyTheme = (theme: "dark" | "light") => {
    setActiveTheme(theme);
    localStorage.setItem("theme", theme);
    if (theme === "light") {
      document.documentElement.classList.add("light");
    } else {
      document.documentElement.classList.remove("light");
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      if (publicKey) {
        await upsertProfile({
          walletAddress: publicKey.toBase58(),
          username: username || undefined,
          bio: bio || undefined,
        });
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error("Failed to save profile:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleLanguageChange = (locale: string) => {
    // Full page reload for locale change — avoids next-intl typed pathname issues
    window.location.href = `/${locale}/settings`;
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="font-mono text-3xl font-bold text-foreground mb-8">{t("title")}</h1>

      <div className="flex gap-6">
        {/* Sidebar tabs */}
        <nav className="w-44 flex-shrink-0 space-y-0.5">
          {TABS.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={cn(
                "w-full flex items-center gap-2.5 px-3 py-2 rounded text-sm font-mono text-left transition-colors",
                activeTab === id
                  ? "bg-elevated text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-card"
              )}
            >
              <Icon className="h-3.5 w-3.5 flex-shrink-0" />
              {label}
            </button>
          ))}
        </nav>

        {/* Tab content */}
        <div className="flex-1 min-w-0">
          {activeTab === "profile" && (
            <div className="bg-card border border-border rounded p-5 space-y-4">
              <h2 className="font-mono text-sm font-semibold text-foreground">
                {t("profile.title")}
              </h2>
              <Field label={t("profile.username")}>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="satoshi"
                  className="w-full bg-background border border-border rounded px-3 py-2 text-sm font-mono text-foreground placeholder-subtle focus:outline-none focus:border-[#14F195]/50 transition-colors"
                />
              </Field>
              <Field label={t("profile.displayName")}>
                <input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Satoshi Nakamoto"
                  className="w-full bg-background border border-border rounded px-3 py-2 text-sm font-mono text-foreground placeholder-subtle focus:outline-none focus:border-[#14F195]/50 transition-colors"
                />
              </Field>
              <Field label={t("profile.bio")}>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Building on Solana..."
                  rows={3}
                  className="w-full bg-background border border-border rounded px-3 py-2 text-sm font-mono text-foreground placeholder-subtle focus:outline-none focus:border-[#14F195]/50 transition-colors resize-none"
                />
              </Field>
              <Field label="Twitter / X">
                <input
                  value={twitterHandle}
                  onChange={(e) => setTwitterHandle(e.target.value)}
                  placeholder="@handle"
                  className="w-full bg-background border border-border rounded px-3 py-2 text-sm font-mono text-foreground placeholder-subtle focus:outline-none focus:border-[#14F195]/50 transition-colors"
                />
              </Field>
              <Field label="GitHub">
                <input
                  value={githubHandle}
                  onChange={(e) => setGithubHandle(e.target.value)}
                  placeholder="username"
                  className="w-full bg-background border border-border rounded px-3 py-2 text-sm font-mono text-foreground placeholder-subtle focus:outline-none focus:border-[#14F195]/50 transition-colors"
                />
              </Field>
              <button
                onClick={handleSaveProfile}
                disabled={saving}
                className="flex items-center gap-2 bg-[#14F195] text-black font-mono font-semibold text-sm px-5 py-2 rounded hover:bg-accent-dim transition-colors disabled:opacity-70"
              >
                {saving ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : saved ? (
                  <Check className="h-3.5 w-3.5" />
                ) : null}
                {saved ? t("profile.saved") : t("profile.save")}
              </button>
              <div className="pt-4 border-t border-border">
                <h3 className="font-mono text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Data Export</h3>
                <p className="text-xs text-muted-foreground mb-3">Download all your progress data, XP history, and credentials.</p>
                <button
                  onClick={() => {
                    const data = {
                      exportedAt: new Date().toISOString(),
                      wallet: publicKey?.toBase58(),
                      username,
                      bio,
                      streak: localStorage.getItem("streak_data"),
                    };
                    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = "superteam-academy-data.json";
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="flex items-center gap-2 border border-border text-muted-foreground font-mono text-xs px-4 py-2 rounded hover:border-border-hover hover:text-foreground transition-colors"
                >
                  Export Data (JSON)
                </button>
              </div>
            </div>
          )}

          {activeTab === "accounts" && (
            <div className="bg-card border border-border rounded p-5 space-y-3">
              <h2 className="font-mono text-sm font-semibold text-foreground">
                {t("accounts.title")}
              </h2>
              <AccountRow
                label={t("accounts.wallet")}
                icon="◎"
                value={publicKey ? `${publicKey.toBase58().slice(0, 6)}...${publicKey.toBase58().slice(-4)}` : undefined}
                connected={connected}
                onConnect={() => setVisible(true)}
                onDisconnect={disconnect}
              />
              <AccountRow
                label={t("accounts.google")}
                icon="G"
                connected={false}
                onConnect={() => {}}
              />
              <AccountRow
                label={t("accounts.github")}
                icon="⌥"
                connected={false}
                onConnect={() => {}}
              />
            </div>
          )}

          {activeTab === "appearance" && (
            <div className="bg-card border border-border rounded p-5 space-y-4">
              <h2 className="font-mono text-sm font-semibold text-foreground">
                {t("appearance.title")}
              </h2>
              <div className="flex gap-3">
                {(["dark", "light"] as const).map((theme) => (
                  <button
                    key={theme}
                    onClick={() => applyTheme(theme)}
                    className={cn(
                      "flex-1 py-3 rounded border font-mono text-sm capitalize transition-colors",
                      activeTheme === theme
                        ? "border-[#14F195] text-[#14F195] bg-[#14F195]/5"
                        : "border-border text-muted-foreground hover:border-border-hover hover:text-foreground"
                    )}
                  >
                    {theme === "dark" ? t("appearance.dark") : t("appearance.light")}
                    {activeTheme === theme && <span className="ml-1.5 text-[9px]">✓</span>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeTab === "language" && (
            <div className="bg-card border border-border rounded p-5 space-y-3">
              <h2 className="font-mono text-sm font-semibold text-foreground">
                {t("language.title")}
              </h2>
              {LANGUAGES.map(({ value, label }) => {
                const isActive = value === currentLocale;
                return (
                  <button
                    key={value}
                    onClick={() => handleLanguageChange(value)}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2.5 rounded border font-mono text-sm transition-colors",
                      isActive
                        ? "border-[#14F195]/30 text-foreground bg-[#14F195]/5"
                        : "border-border text-muted-foreground hover:border-border-hover hover:text-foreground"
                    )}
                  >
                    <span>{label}</span>
                    {isActive && <Check className="h-3.5 w-3.5 text-[#14F195]" />}
                  </button>
                );
              })}
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="bg-card border border-border rounded p-5 space-y-4">
              <h2 className="font-mono text-sm font-semibold text-foreground">Notifications</h2>
              {[
                { label: "Email notifications", sublabel: "Receive updates via email", state: emailNotifs, set: setEmailNotifs },
                { label: "Streak reminders", sublabel: "Daily reminders to keep your streak", state: streakReminder, set: setStreakReminder },
                { label: "Achievement alerts", sublabel: "Get notified when you earn badges", state: achievementNotifs, set: setAchievementNotifs },
              ].map(({ label, sublabel, state, set }) => (
                <div key={label} className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-mono text-foreground">{label}</p>
                    <p className="text-xs text-muted-foreground">{sublabel}</p>
                  </div>
                  <button
                    onClick={() => { set(!state); localStorage.setItem(`notif_${label}`, String(!state)); }}
                    className={`w-10 h-5 rounded-full transition-colors relative ${state ? "bg-[#14F195]" : "bg-[#333333]"}`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all shadow ${state ? "left-5" : "left-0.5"}`} />
                  </button>
                </div>
              ))}
              <p className="text-[10px] text-subtle font-mono">Notification preferences are saved locally.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-mono text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}

function AccountRow({
  label,
  icon,
  value,
  connected,
  onConnect,
  onDisconnect,
}: {
  label: string;
  icon: string;
  value?: string;
  connected: boolean;
  onConnect: () => void;
  onDisconnect?: () => void;
}) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
      <div className="flex items-center gap-2.5">
        <span className="w-6 h-6 rounded bg-elevated flex items-center justify-center text-xs font-mono text-muted-foreground">
          {icon}
        </span>
        <div>
          <p className="text-sm font-mono text-foreground">{label}</p>
          {value && <p className="text-[10px] font-mono text-muted-foreground">{value}</p>}
        </div>
      </div>
      {connected ? (
        <button
          onClick={onDisconnect}
          className="text-xs font-mono text-[#FF4444] hover:text-[#FF6666] transition-colors"
        >
          Disconnect
        </button>
      ) : (
        <button
          onClick={onConnect}
          className="text-xs font-mono text-[#14F195] hover:text-[#0D9E61] transition-colors"
        >
          Connect
        </button>
      )}
    </div>
  );
}
