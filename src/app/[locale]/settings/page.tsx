"use client";

import { useTranslations } from "next-intl";
import { useWallet } from "@solana/wallet-adapter-react";
import { signIn, signOut, useSession } from "next-auth/react";
import {
  Settings,
  Wallet,
  Zap,
  Link2,
  Unlink,
  LogOut,
  ExternalLink,
  Copy,
  Check,
  Download,
} from "lucide-react";
import { useSigningMode } from "@/hooks/useSigningMode";
import { useXpBalance } from "@/hooks/useXpBalance";
import { useAuthGate } from "@/hooks/useAuthGate";
import { useEffect, useState } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { SpotlightCard } from "@/components/ui/spotlight-card";
import { WalletButton } from "@/components/WalletButton";
import type { LinkedAccount, SocialAuthInfo } from "@/services/AuthService";
import { getAuthService } from "@/services/AuthService";

const EXPLORER_BASE = "https://explorer.solana.com/address";

type CmsStatus = {
  sanityConfigured: boolean;
  contentMode: "sanity-with-fallback" | "local-json";
  courseCount: number;
  lessonCounts: Record<string, number>;
};

type AuthProviders = {
  google: boolean;
  github: boolean;
};

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-8">
      <h2
        className="text-base font-semibold mb-4"
        style={{ color: "var(--text-primary)" }}
      >
        {title}
      </h2>
      <SpotlightCard className="rounded-xl overflow-hidden" spotlightColor="rgba(153, 69, 255, 0.2)">
        <div
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border-subtle)",
          }}
        >
          {children}
        </div>
      </SpotlightCard>
    </div>
  );
}

function Row({
  label,
  description,
  children,
  last = false,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
  last?: boolean;
}) {
  return (
    <div
      className="flex items-center justify-between px-5 py-4 gap-4"
      style={{ borderBottom: last ? "none" : "1px solid var(--border-subtle)" }}
    >
      <div className="min-w-0">
        <p
          className="text-sm font-medium"
          style={{ color: "var(--text-primary)" }}
        >
          {label}
        </p>
        {description && (
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            {description}
          </p>
        )}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Badge({
  label,
  color,
}: {
  label: string;
  color: "purple" | "green" | "amber";
}) {
  const styles = {
    purple: {
      color: "var(--text-purple)",
      bg: "rgba(153,69,255,0.1)",
      border: "1px solid rgba(153,69,255,0.25)",
    },
    green: {
      color: "var(--solana-green)",
      bg: "rgba(25,251,155,0.1)",
      border: "1px solid rgba(25,251,155,0.25)",
    },
    amber: {
      color: "#fbbf24",
      bg: "rgba(251,191,36,0.1)",
      border: "1px solid rgba(251,191,36,0.2)",
    },
  };
  const s = styles[color];
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
      style={{ color: s.color, background: s.bg, border: s.border }}
    >
      {label}
    </span>
  );
}

export default function SettingsPage() {
  const { isLoggedIn, isChecking, redirectToAuth } = useAuthGate();
  const { publicKey, connected } = useWallet();
  const { data: session, status: sessionStatus } = useSession();
  const signingMode = useSigningMode();
  const { data: xp } = useXpBalance();
  const [copied, setCopied] = useState(false);
  const [cmsStatus, setCmsStatus] = useState<CmsStatus | null>(null);
  const [providers, setProviders] = useState<AuthProviders>({
    google: false,
    github: false,
  });
  const [linkedAccounts, setLinkedAccounts] = useState<LinkedAccount>({});
  const [linkBusy, setLinkBusy] = useState(false);
  const [linkMessage, setLinkMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const t = useTranslations("Settings");

  useEffect(() => {
    if (isChecking) return;
    if (!isLoggedIn) {
      redirectToAuth();
    }
  }, [isChecking, isLoggedIn, redirectToAuth]);

  useEffect(() => {
    let active = true;
    fetch("/api/cms-status")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: CmsStatus | null) => {
        if (active) setCmsStatus(data);
      })
      .catch(() => {
        if (active) setCmsStatus(null);
      });
    return () => {
      active = false;
    };
  }, []);

  const address = publicKey?.toBase58() ?? "";
  const shortAddress = address
    ? `${address.slice(0, 8)}...${address.slice(-8)}`
    : "";
  const explorerUrl = `${EXPLORER_BASE}/${address}?cluster=devnet`;
  const socialProvider =
    session?.provider === "google" || session?.provider === "github"
      ? session.provider
      : null;

  const socialInfo: SocialAuthInfo | null =
    socialProvider && session?.providerAccountId && session.user?.email
      ? {
          type: socialProvider,
          uid: session.providerAccountId,
          email: session.user.email,
          displayName: session.user.name ?? null,
          avatarUrl: session.user.image ?? null,
        }
      : null;

  const socialLinked =
    socialProvider === "google"
      ? linkedAccounts.google?.uid === session?.providerAccountId
      : socialProvider === "github"
        ? linkedAccounts.github?.uid === session?.providerAccountId
        : false;

  useEffect(() => {
    let active = true;
    fetch("/api/auth/providers")
      .then((r) => (r.ok ? r.json() : {}))
      .then((value: Record<string, unknown>) => {
        if (!active) return;
        setProviders({
          google: Boolean(value.google),
          github: Boolean(value.github),
        });
      })
      .catch(() => {
        if (!active) return;
        setProviders({ google: false, github: false });
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!address) {
      setLinkedAccounts({});
      return;
    }

    let active = true;
    const authService = getAuthService();
    authService
      .linkWallet(address)
      .then(() => authService.getLinkedAccounts(address))
      .then((accounts) => {
        if (active) setLinkedAccounts(accounts);
      })
      .catch(() => {
        if (active) setLinkedAccounts({ wallet: address });
      });

    return () => {
      active = false;
    };
  }, [address]);

  function copyAddress() {
    if (!address) return;
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleProviderSignIn(provider: "google" | "github") {
    await signIn(provider, {
      callbackUrl: typeof window !== "undefined" ? window.location.href : undefined,
    });
  }

  async function handleLinkSocial() {
    if (!address || !socialInfo) return;
    setLinkBusy(true);
    setLinkMessage(null);
    try {
      const next = await getAuthService().linkSocialAccount(address, socialInfo);
      setLinkedAccounts(next);
      setLinkMessage({
        type: "success",
        text: t("account.linking.linked"),
      });
    } catch {
      setLinkMessage({
        type: "error",
        text: t("account.linking.failed"),
      });
    } finally {
      setLinkBusy(false);
    }
  }

  async function handleUnlinkSocial() {
    if (!address || !socialProvider) return;
    setLinkBusy(true);
    setLinkMessage(null);
    try {
      const next = await getAuthService().unlinkSocialAccount(
        address,
        socialProvider,
      );
      setLinkedAccounts(next);
      setLinkMessage({
        type: "success",
        text: t("account.linking.unlinked"),
      });
    } catch {
      setLinkMessage({
        type: "error",
        text: t("account.linking.failed"),
      });
    } finally {
      setLinkBusy(false);
    }
  }

  if (isChecking) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div
          className="h-64 rounded-2xl skeleton-shimmer"
          style={{ background: "var(--bg-surface)" }}
        />
      </div>
    );
  }

  if (!isLoggedIn) {
    return null;
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(153,69,255,0.1)" }}
          >
            <Settings size={18} style={{ color: "var(--solana-purple)" }} />
          </div>
          <h1
            className="text-3xl font-bold tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            {t("title")}
          </h1>
        </div>
        <p className="text-base" style={{ color: "var(--text-secondary)" }}>
          {t("header.subtitle")}
        </p>
      </div>

      <Section title={t("sections.language")}>
        <Row
          label={t("language.currentLabel")}
          description={t("language.currentDescription")}
          last
        >
          <LocaleSwitcher variant="settings" />
        </Row>
      </Section>

      <Section title={t("sections.account")}>
        <Row
          label={t("account.session.label")}
          description={t("account.session.description")}
        >
          {sessionStatus === "loading" ? (
            <Badge label={t("account.session.loading")} color="purple" />
          ) : session && socialProvider ? (
            <div className="flex flex-col items-end gap-2">
              <Badge
                label={t("account.session.active", {
                  provider: t(`account.providers.${socialProvider}`),
                })}
                color="green"
              />
              <button
                onClick={() =>
                  signOut({
                    callbackUrl:
                      typeof window !== "undefined" ? window.location.href : "/",
                  })
                }
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors duration-150"
                style={{
                  background: "var(--bg-elevated)",
                  color: "var(--text-primary)",
                  border: "1px solid var(--border-default)",
                }}
              >
                <LogOut size={12} aria-hidden="true" />
                {t("account.session.signOut")}
              </button>
            </div>
          ) : (
            <Badge label={t("account.session.none")} color="amber" />
          )}
        </Row>

        <Row
          label={t("account.google.label")}
          description={t("account.google.description")}
        >
          {providers.google ? (
              <button
                onClick={() => handleProviderSignIn("google")}
                disabled={sessionStatus === "loading"}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
                style={{
                  background:
                    session?.provider === "google"
                      ? "linear-gradient(135deg, rgba(25,251,155,0.2), rgba(153,69,255,0.18))"
                      : "linear-gradient(135deg, rgba(153,69,255,0.95), rgba(25,251,155,0.72))",
                  color: "#fff",
                  border: "1px solid rgba(153,69,255,0.35)",
                  boxShadow: "0 8px 20px rgba(153,69,255,0.24)",
                }}
              >
                {session?.provider === "google"
                  ? t("account.google.connected")
                : t("account.google.connect")}
            </button>
          ) : (
            <Badge label={t("account.google.notConfigured")} color="amber" />
          )}
        </Row>

        <Row
          label={t("account.github.label")}
          description={t("account.github.description")}
        >
          {providers.github ? (
              <button
                onClick={() => handleProviderSignIn("github")}
                disabled={sessionStatus === "loading"}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
                style={{
                  background:
                    session?.provider === "github"
                      ? "linear-gradient(135deg, rgba(25,251,155,0.2), rgba(153,69,255,0.18))"
                      : "linear-gradient(135deg, rgba(0,140,76,0.92), rgba(47,107,63,0.82))",
                  color: "#fff",
                  border: "1px solid rgba(0,140,76,0.35)",
                  boxShadow: "0 8px 20px rgba(0,140,76,0.22)",
                }}
              >
                {session?.provider === "github"
                  ? t("account.github.connected")
                : t("account.github.connect")}
            </button>
          ) : (
            <Badge label={t("account.github.notConfigured")} color="amber" />
          )}
        </Row>

        <Row
          label={t("account.linking.label")}
          description={t("account.linking.description")}
          last
        >
          {!socialInfo ? (
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>
              {t("account.linking.signInFirst")}
            </span>
          ) : !connected ? (
            <span className="text-xs" style={{ color: "#fbbf24" }}>
              {t("account.linking.connectWalletFirst")}
            </span>
          ) : (
            <div className="flex flex-col items-end gap-2">
              <button
                onClick={socialLinked ? handleUnlinkSocial : handleLinkSocial}
                disabled={linkBusy}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
                style={{
                  background: socialLinked
                    ? "linear-gradient(135deg, rgba(248,113,113,0.9), rgba(220,38,38,0.86))"
                    : "linear-gradient(135deg, rgba(0,140,76,0.92), rgba(25,251,155,0.7))",
                  color: "#fff",
                  border: socialLinked
                    ? "1px solid rgba(248,113,113,0.35)"
                    : "1px solid rgba(25,251,155,0.3)",
                  boxShadow: socialLinked
                    ? "0 8px 20px rgba(248,113,113,0.22)"
                    : "0 8px 20px rgba(0,140,76,0.22)",
                }}
              >
                {socialLinked ? (
                  <Unlink size={12} aria-hidden="true" />
                ) : (
                  <Link2 size={12} aria-hidden="true" />
                )}
                {socialLinked
                  ? t("account.linking.unlink")
                  : t("account.linking.link")}
              </button>
              <span
                className="text-xs"
                style={{
                  color: socialLinked ? "var(--solana-green)" : "var(--text-muted)",
                }}
              >
                {socialLinked
                  ? t("account.linking.statusLinked")
                  : t("account.linking.statusNotLinked")}
              </span>
              {linkMessage ? (
                <span
                  className="text-xs"
                  style={{
                    color:
                      linkMessage.type === "success"
                        ? "var(--solana-green)"
                        : "#f87171",
                  }}
                >
                  {linkMessage.text}
                </span>
              ) : null}
            </div>
          )}
        </Row>
      </Section>

      <Section title={t("sections.wallet")}>
        <Row
          label={t("wallet.action.label")}
          description={t("wallet.action.description")}
        >
          <WalletButton />
        </Row>

        <Row
          label={t("wallet.address.label")}
          description={t("wallet.address.description")}
        >
          <div className="flex items-center gap-2">
            <span
              className="text-xs font-mono"
              style={{ color: "var(--text-secondary)" }}
            >
              {shortAddress || t("wallet.address.notConnected")}
            </span>
            <button
              onClick={copyAddress}
              disabled={!connected}
              className="p-1.5 rounded-md transition-colors duration-150"
              style={{
                background: "var(--bg-elevated)",
                color: "var(--text-muted)",
              }}
              aria-label={t("wallet.address.copyAria")}
            >
              {copied ? <Check size={13} /> : <Copy size={13} />}
            </button>
            <a
              href={connected ? explorerUrl : "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-md transition-colors duration-150"
              style={{
                background: "var(--bg-elevated)",
                color: "var(--text-muted)",
                pointerEvents: connected ? "auto" : "none",
                opacity: connected ? 1 : 0.5,
              }}
              aria-label={t("wallet.address.viewExplorerAria")}
            >
              <ExternalLink size={13} />
            </a>
          </div>
        </Row>

        <Row
          label={t("wallet.network.label")}
          description={t("wallet.network.description")}
        >
          <Badge label={t("wallet.network.devnet")} color="amber" />
        </Row>

        <Row
          label={t("wallet.signingMode.label")}
          description={t("wallet.signingMode.description")}
          last
        >
          <Badge
            label={
              signingMode === "onchain"
                ? t("wallet.signingMode.values.onchain")
                : t("wallet.signingMode.values.stub")
            }
            color={signingMode === "onchain" ? "green" : "purple"}
          />
        </Row>
      </Section>

      <Section title={t("sections.onchainStats")}>
        <Row
          label={t("stats.totalXp.label")}
          description={t("stats.totalXp.description")}
        >
          <div className="flex items-center gap-1.5">
            <Zap
              size={14}
              style={{ color: "var(--text-purple)" }}
              aria-hidden="true"
            />
            <span
              className="text-sm font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              {t("stats.totalXp.value", {
                amount: (xp?.amount ?? 0).toLocaleString("en-US"),
              })}
            </span>
          </div>
        </Row>
        <Row
          label={t("stats.level.label")}
          description={t("stats.level.description")}
          last
        >
          <span
            className="text-sm font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            {xp?.level ?? 0}
          </span>
        </Row>
      </Section>

      <Section title={t("sections.preferences")}>
        <Row
          label={t("preferences.theme.label")}
          description={t("preferences.theme.description")}
        >
          <ThemeToggle />
        </Row>
        <Row
          label={t("preferences.language.label")}
          description={t("preferences.language.description")}
          last
        >
          <LocaleSwitcher variant="settings" />
        </Row>
      </Section>

      <Section title={t("sections.dataPrivacy")}>
        <Row
          label={t("dataPrivacy.export.label")}
          description={t("dataPrivacy.export.description")}
          last
        >
          <button
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150"
            style={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--border-default)",
              color: "var(--text-primary)",
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLElement).style.borderColor =
                "var(--border-subtle)")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLElement).style.borderColor =
                "var(--border-default)")
            }
          >
            <Download size={14} aria-hidden="true" />
            {t("dataPrivacy.export.button")}
          </button>
        </Row>
      </Section>

      <Section title={t("sections.about")}>
        <Row
          label={t("about.platform.label")}
          description={t("about.platform.description")}
        >
          <span className="text-sm" style={{ color: "var(--text-muted)" }}>
            {t("about.platform.value")}
          </span>
        </Row>
        <Row label={t("about.network.label")}>
          <span className="text-sm" style={{ color: "var(--text-muted)" }}>
            {t("about.network.value")}
          </span>
        </Row>
        <Row
          label={t("about.program.label")}
          description={t("about.program.description")}
          last
        >
          <a
            href="https://explorer.solana.com?cluster=devnet"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs transition-colors duration-150"
            style={{ color: "var(--text-purple)" }}
          >
            {t("about.program.link")}
            <ExternalLink size={12} aria-hidden="true" />
          </a>
        </Row>
      </Section>

      <Section title={t("sections.contentSource")}>
        <Row
          label={t("contentSource.mode.label")}
          description={t("contentSource.mode.description")}
        >
          <Badge
            label={
              cmsStatus?.contentMode === "sanity-with-fallback"
                ? t("contentSource.mode.values.sanityFallback")
                : t("contentSource.mode.values.localJson")
            }
            color={cmsStatus?.contentMode === "sanity-with-fallback" ? "green" : "purple"}
          />
        </Row>
        <Row
          label={t("contentSource.courseCount.label")}
          description={t("contentSource.courseCount.description")}
          last
        >
          <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
            {cmsStatus?.courseCount ?? t("contentSource.courseCount.unknown")}
          </span>
        </Row>
      </Section>

      <div
        className="rounded-xl p-4 flex items-center gap-3"
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border-subtle)",
        }}
      >
        <Wallet
          size={16}
          style={{ color: "var(--text-muted)" }}
          aria-hidden="true"
        />
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          {connected ? t("wallet.disconnectNote") : t("wallet.connectNote")}
        </p>
      </div>
    </div>
  );
}
