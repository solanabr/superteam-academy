"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { Check, Loader2, Globe, Palette, User, Link2 } from "lucide-react";

type SettingsTab = "profile" | "accounts" | "appearance" | "language";

const TABS: Array<{ id: SettingsTab; icon: typeof User; label: string }> = [
  { id: "profile", icon: User, label: "Profile" },
  { id: "accounts", icon: Link2, label: "Linked Accounts" },
  { id: "appearance", icon: Palette, label: "Appearance" },
  { id: "language", icon: Globe, label: "Language" },
];

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "pt-BR", label: "Português (Brasil)" },
  { value: "es", label: "Español" },
];

export default function SettingsPage() {
  const t = useTranslations("settings");
  const router = useRouter();
  const { publicKey, connected, disconnect } = useWallet();
  const { setVisible } = useWalletModal();

  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      // TODO: upsertProfile from @/lib/supabase
      await new Promise((r) => setTimeout(r, 800)); // mock delay
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  const handleLanguageChange = (locale: string) => {
    router.replace("/settings", { locale });
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="font-mono text-3xl font-bold text-[#EDEDED] mb-8">{t("title")}</h1>

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
                  ? "bg-[#1A1A1A] text-[#EDEDED]"
                  : "text-[#666666] hover:text-[#EDEDED] hover:bg-[#111111]"
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
            <div className="bg-[#111111] border border-[#1F1F1F] rounded p-5 space-y-4">
              <h2 className="font-mono text-sm font-semibold text-[#EDEDED]">
                {t("profile.title")}
              </h2>
              <Field label={t("profile.username")}>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="satoshi"
                  className="w-full bg-[#0A0A0A] border border-[#1F1F1F] rounded px-3 py-2 text-sm font-mono text-[#EDEDED] placeholder-[#333333] focus:outline-none focus:border-[#14F195]/50 transition-colors"
                />
              </Field>
              <Field label={t("profile.displayName")}>
                <input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Satoshi Nakamoto"
                  className="w-full bg-[#0A0A0A] border border-[#1F1F1F] rounded px-3 py-2 text-sm font-mono text-[#EDEDED] placeholder-[#333333] focus:outline-none focus:border-[#14F195]/50 transition-colors"
                />
              </Field>
              <Field label={t("profile.bio")}>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Building on Solana..."
                  rows={3}
                  className="w-full bg-[#0A0A0A] border border-[#1F1F1F] rounded px-3 py-2 text-sm font-mono text-[#EDEDED] placeholder-[#333333] focus:outline-none focus:border-[#14F195]/50 transition-colors resize-none"
                />
              </Field>
              <button
                onClick={handleSaveProfile}
                disabled={saving}
                className="flex items-center gap-2 bg-[#14F195] text-black font-mono font-semibold text-sm px-5 py-2 rounded hover:bg-[#0D9E61] transition-colors disabled:opacity-70"
              >
                {saving ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : saved ? (
                  <Check className="h-3.5 w-3.5" />
                ) : null}
                {saved ? t("profile.saved") : t("profile.save")}
              </button>
            </div>
          )}

          {activeTab === "accounts" && (
            <div className="bg-[#111111] border border-[#1F1F1F] rounded p-5 space-y-3">
              <h2 className="font-mono text-sm font-semibold text-[#EDEDED]">
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
            <div className="bg-[#111111] border border-[#1F1F1F] rounded p-5 space-y-4">
              <h2 className="font-mono text-sm font-semibold text-[#EDEDED]">
                {t("appearance.title")}
              </h2>
              <div className="flex gap-3">
                {["dark", "light"].map((theme) => (
                  <button
                    key={theme}
                    className={cn(
                      "flex-1 py-3 rounded border font-mono text-sm capitalize transition-colors",
                      theme === "dark"
                        ? "border-[#14F195] text-[#14F195] bg-[#14F195]/5"
                        : "border-[#1F1F1F] text-[#666666] hover:border-[#2E2E2E]"
                    )}
                  >
                    {theme === "dark" ? t("appearance.dark") : t("appearance.light")}
                    {theme === "dark" && <span className="ml-1.5 text-[9px]">✓</span>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeTab === "language" && (
            <div className="bg-[#111111] border border-[#1F1F1F] rounded p-5 space-y-3">
              <h2 className="font-mono text-sm font-semibold text-[#EDEDED]">
                {t("language.title")}
              </h2>
              {LANGUAGES.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => handleLanguageChange(value)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2.5 rounded border font-mono text-sm transition-colors",
                    value === "en"
                      ? "border-[#14F195]/30 text-[#EDEDED] bg-[#14F195]/5"
                      : "border-[#1F1F1F] text-[#666666] hover:border-[#2E2E2E] hover:text-[#EDEDED]"
                  )}
                >
                  <span>{label}</span>
                  {value === "en" && <Check className="h-3.5 w-3.5 text-[#14F195]" />}
                </button>
              ))}
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
      <label className="text-xs font-mono text-[#666666]">{label}</label>
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
    <div className="flex items-center justify-between py-2.5 border-b border-[#1F1F1F] last:border-0">
      <div className="flex items-center gap-2.5">
        <span className="w-6 h-6 rounded bg-[#1A1A1A] flex items-center justify-center text-xs font-mono text-[#666666]">
          {icon}
        </span>
        <div>
          <p className="text-sm font-mono text-[#EDEDED]">{label}</p>
          {value && <p className="text-[10px] font-mono text-[#666666]">{value}</p>}
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
