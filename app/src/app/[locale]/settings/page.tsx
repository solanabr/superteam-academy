"use client";

import { useEffect, useState } from "react";
import { useAppUser } from "@/hooks/useAppUser";
import { usePrivy } from "@privy-io/react-auth";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Save, Lock, Mail, Wallet, Coins, Info } from "lucide-react";
import { useTranslations } from "next-intl";
import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { useUserStore } from "@/store/user-store";

// ─── Provider Icons ────────────────────────────────────────────────────────────

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}

// ─── Linked Account Row ────────────────────────────────────────────────────────

type LinkedAccountRowProps = {
  icon: React.ReactNode;
  label: string;
  value: string;
  tooltip: string;
  linkedText: string;
};

function LinkedAccountRow({ icon, label, value, tooltip, linkedText }: LinkedAccountRowProps) {
  const [showTip, setShowTip] = useState(false);

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-text-secondary flex items-center gap-2">
        {label}
        <span className="text-[10px] font-mono text-text-muted uppercase tracking-wider bg-white/5 px-1.5 py-0.5 rounded">{linkedText}</span>
      </label>
      <div className="relative">
        <div className="flex items-center gap-3 h-10 px-3 rounded-md border border-white/10 bg-black/20 opacity-70">
          <span className="flex-shrink-0">{icon}</span>
          <span className="text-sm text-text-primary font-mono flex-1 truncate">{value}</span>
          <button
            type="button"
            className="flex-shrink-0 text-text-muted hover:text-text-secondary transition-colors"
            onMouseEnter={() => setShowTip(true)}
            onMouseLeave={() => setShowTip(false)}
            onFocus={() => setShowTip(true)}
            onBlur={() => setShowTip(false)}
            aria-label="Why can't I edit this?"
          >
            <Lock className="h-3.5 w-3.5" />
          </button>
        </div>
        {showTip && (
          <div className="absolute right-0 top-full mt-1.5 z-10 w-64 rounded-md bg-[#1a1a1f] border border-white/10 px-3 py-2 text-xs text-text-secondary shadow-xl">
            {tooltip}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

import { PlatformNavbar } from "@/components/navigation/PlatformNavbar";

export default function SettingsPage() {
  const t = useTranslations("settings");
  const tc = useTranslations("common");
  const { user, isLoading: userLoading } = useAppUser();
  const { user: privyUser } = usePrivy();

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");
  const [showRoleTip, setShowRoleTip] = useState(false);
  const [solBalance, setSolBalance] = useState<number | null>(null);
  const [showAirdropTip, setShowAirdropTip] = useState(false);
  // Zustand
  const progress = useUserStore((s) => s.progress);
  const fetchProgress = useUserStore((s) => s.fetchProgress);

  // Detect linked OAuth providers from Privy
  const linkedGoogle = privyUser?.linkedAccounts?.find((a) => a.type === "google_oauth") as any;
  const linkedGithub = privyUser?.linkedAccounts?.find((a) => a.type === "github_oauth") as any;
  const linkedEmail = privyUser?.linkedAccounts?.find((a) => a.type === "email") as any;

  // If any OAuth provider is linked, email is not editable (it's tied to the wallet)
  const hasOAuthProvider = !!(linkedGoogle || linkedGithub);

  useEffect(() => {
    if (user) {
      const profile = user.profile as any;
      setDisplayName(profile?.displayName ?? "");
      setBio(profile?.bio ?? "");
      // Only pre-fill editable email for wallet-only accounts
      if (!hasOAuthProvider) {
        setEmail(user.email ?? linkedEmail?.address ?? "");
      }

      // Fetch Progress (for EXP balance)
      if (user.walletAddress && !progress) {
        fetchProgress(user.walletAddress);
      }

      // Fetch SOL Balance
      const fetchSol = async () => {
        try {
          const conn = new Connection(process.env.NEXT_PUBLIC_RPC_URL || "https://api.devnet.solana.com");
          const balance = await conn.getBalance(new PublicKey(user.walletAddress));
          setSolBalance(balance / LAMPORTS_PER_SOL);
        } catch (e) {
          console.error("Failed to fetch SOL balance", e);
        }
      };
      fetchSol();
    }
  }, [user, hasOAuthProvider, linkedEmail, fetchProgress, progress]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.walletAddress) return;
    setSaving(true);
    setSaveStatus("idle");

    try {
      const res = await fetch("/api/user", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wallet: user.walletAddress,
          ...(!hasOAuthProvider && email ? { email } : {}),
          profile: { displayName, bio },
        }),
      });

      setSaveStatus(res.ok ? "success" : "error");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch {
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } finally {
      setSaving(false);
    }
  };

  if (userLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="text-solana h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8 text-center">
        <p className="text-text-secondary">{t("connect_wallet_prompt")}</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-void pt-20 pb-12">
      <PlatformNavbar />
      <div className="mx-auto max-w-2xl px-4">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/dashboard" className="p-2 rounded-full hover:bg-white/5 text-text-secondary hover:text-white transition-colors">
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <h1 className="font-display text-text-primary text-2xl font-semibold">{t("title")}</h1>
        </div>

        <div className="glass-panel rounded-lg border border-white/5 p-8">
          <form onSubmit={handleSave} className="space-y-6">

            {/* Wallet Address */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-secondary">{t("wallet_address")}</label>
              <Input
                value={user.walletAddress}
                disabled
                className="font-mono text-xs opacity-50 bg-black/20"
              />
            </div>

            {/* Account Role */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-secondary">{t("account_role")}</label>
              <div className="flex items-center gap-3 h-10 px-3 rounded-md border border-white/10 bg-black/20">
                <span className={`material-symbols-outlined text-lg ${user.role === "admin" ? "text-amber-400" :
                  user.role === "professor" ? "text-blue-400" : "text-solana"
                  }`}>
                  {user.role === "admin" ? "admin_panel_settings" :
                    user.role === "professor" ? "psychology" : "school"}
                </span>
                <span className={`text-sm font-display font-semibold capitalize ${user.role === "admin" ? "text-amber-400" :
                  user.role === "professor" ? "text-blue-400" : "text-solana"
                  }`}>
                  {user.role === "professor" ? "Teacher" : user.role ?? "Student"}
                </span>
                <div className="ml-auto relative flex items-center">
                  <button
                    type="button"
                    className="text-text-muted hover:text-text-secondary transition-colors"
                    onMouseEnter={() => setShowRoleTip(true)}
                    onMouseLeave={() => setShowRoleTip(false)}
                    onFocus={() => setShowRoleTip(true)}
                    onBlur={() => setShowRoleTip(false)}
                  >
                    <Lock className="h-3.5 w-3.5" />
                  </button>
                  {showRoleTip && (
                    <div className="absolute right-0 bottom-full mb-2 z-10 w-64 rounded-md bg-[#1a1a1f] border border-white/10 px-3 py-2 text-xs text-text-secondary shadow-xl normal-case font-body">
                      {t("role_info")}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ── Wallet Balances ─────────────────────────────── */}
            <div className="pt-4 border-t border-white/5 space-y-4">
              <h3 className="text-sm font-medium text-text-primary flex items-center gap-2">
                <Wallet className="h-4 w-4 text-solana" />
                {t("balance_title")}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-black/20 border border-white/5 flex flex-col gap-1 relative overflow-visible">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-text-muted uppercase tracking-widest">{t("sol_balance")}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono font-bold text-amber-500/80 uppercase px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                        {t("devnet_label")}
                      </span>
                      <button
                        type="button"
                        onMouseEnter={() => setShowAirdropTip(true)}
                        onMouseLeave={() => setShowAirdropTip(false)}
                        className="text-text-muted hover:text-text-secondary transition-colors"
                      >
                        <Info className="h-3 w-3" />
                      </button>
                    </div>
                  </div>

                  {showAirdropTip && (
                    <div className="absolute right-0 bottom-full mb-2 z-20 w-64 rounded-md bg-[#1a1a1f] border border-white/10 px-3 py-2 text-[11px] leading-relaxed text-text-secondary shadow-xl font-body">
                      {t("airdrop_tooltip")}
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-mono font-bold text-white">
                        {solBalance !== null ? solBalance.toFixed(4) : "..."}
                      </span>
                      <span className="text-xs text-text-muted font-mono">SOL</span>
                    </div>

                    {solBalance !== null && solBalance < 0.5 && (
                      <a
                        href="https://faucet.solana.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] font-bold text-solana hover:text-white transition-colors flex items-center gap-1 bg-solana/10 px-2 py-1 rounded border border-solana/20"
                      >
                        <span className="material-symbols-outlined text-[12px]">open_in_new</span>
                        Get SOL
                      </a>
                    )}
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-black/20 border border-white/5 flex flex-col gap-1">
                  <span className="text-[10px] font-mono text-text-muted uppercase tracking-widest">{t("exp_balance")}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-mono font-bold text-solana">
                      {progress?.xp ? progress.xp.toLocaleString() : "0"}
                    </span>
                    <Coins className="h-4 w-4 text-solana" />
                  </div>
                </div>
              </div>
            </div>

            {/* ── Linked Accounts ─────────────────────────────── */}
            <div className="space-y-4 pt-4 border-t border-white/5">
              {linkedGoogle && (
                <LinkedAccountRow
                  icon={<GoogleIcon className="h-4 w-4" />}
                  label={t("linked_accounts.google")}
                  value={linkedGoogle.email ?? linkedGoogle.name ?? "Connected"}
                  tooltip={t("linked_accounts.tooltip", { provider: "Google" })}
                  linkedText={t("linked_accounts.linked")}
                />
              )}

              {linkedGithub && (
                <LinkedAccountRow
                  icon={<GitHubIcon className="h-4 w-4 text-white" />}
                  label={t("linked_accounts.github")}
                  value={linkedGithub.username ?? linkedGithub.name ?? linkedGithub.email ?? "Connected"}
                  tooltip={t("linked_accounts.tooltip", { provider: "GitHub" })}
                  linkedText={t("linked_accounts.linked")}
                />
              )}

              {linkedEmail && !linkedGoogle && !linkedGithub && (
                <LinkedAccountRow
                  icon={<Mail className="h-4 w-4 text-text-secondary" />}
                  label={t("linked_accounts.email")}
                  value={linkedEmail.address ?? "Connected"}
                  tooltip={t("linked_accounts.tooltip", { provider: "email" })}
                  linkedText={t("linked_accounts.linked")}
                />
              )}
            </div>

            {/* Display Name */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-primary">{t("display_name")}</label>
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={t("display_name_placeholder")}
                className="bg-black/20 border-white/10 focus:border-solana/50"
              />
            </div>

            {/* Email — only editable for wallet-only accounts */}
            {!hasOAuthProvider && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-primary">{t("email")}</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("email_placeholder")}
                  className="bg-black/20 border-white/10 focus:border-solana/50"
                />
              </div>
            )}

            {/* Bio */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-primary">{t("bio")}</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder={t("bio_placeholder")}
                className="flex min-h-[80px] w-full rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-solana/50 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            {/* Save */}
            <div className="flex items-center gap-4 pt-4">
              <Button type="submit" disabled={saving} className="w-full sm:w-auto">
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("saving")}
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {t("save_changes")}
                  </>
                )}
              </Button>
              {saveStatus === "success" && (
                <span className="text-sm text-solana font-medium">{t("save_success")}</span>
              )}
              {saveStatus === "error" && (
                <span className="text-sm text-rust font-medium">{t("save_error")}</span>
              )}
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
