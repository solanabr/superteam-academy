"use client";

import { useEffect, useState, useRef } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import type { UserIdentity } from "@supabase/supabase-js";
import { GithubLogo } from "@phosphor-icons/react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GoogleLogo } from "@/components/icons/google-logo";
import { SolanaLogo } from "@/components/icons/solana-logo";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth/auth-provider";
import { createSIWSMessage, formatSIWSMessage } from "@/lib/solana/wallet-auth";

// ── Types ─────────────────────────────────────────────────────────
interface AccountTabProps {
  initialWalletAddress: string | null;
  initialGoogleEmail: string | null;
  initialGoogleIdentity: UserIdentity | null;
  initialGitHubEmail: string | null;
  initialGitHubIdentity: UserIdentity | null;
  avatarUrl: string | null;
  onAvatarChange: (url: string | null) => void;
}

export function AccountTab({
  initialWalletAddress,
  initialGoogleEmail,
  initialGoogleIdentity,
  initialGitHubEmail,
  initialGitHubIdentity,
  avatarUrl,
  onAvatarChange,
}: AccountTabProps) {
  const t = useTranslations("settings");
  const locale = useLocale();
  const searchParams = useSearchParams();
  const { publicKey, signMessage, connected } = useWallet();
  const { setVisible: openWalletModal } = useWalletModal();
  const { refreshProfile } = useAuth();

  // ── Local state ───────────────────────────────────────────────
  const [walletAddress, setWalletAddress] = useState(initialWalletAddress);
  const [googleEmail, setGoogleEmail] = useState(initialGoogleEmail);
  const [googleIdentity, setGoogleIdentity] = useState(initialGoogleIdentity);
  const [gitHubEmail, setGitHubEmail] = useState(initialGitHubEmail);
  const [gitHubIdentity, setGitHubIdentity] = useState(initialGitHubIdentity);
  const [isLinkingWallet, setIsLinkingWallet] = useState(false);
  const [isLinkingGoogle, setIsLinkingGoogle] = useState(false);
  const [isLinkingGitHub, setIsLinkingGitHub] = useState(false);
  const [linkMessage, setLinkMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const pendingWalletLink = useRef(false);

  // ── Post-Google-link handler ──────────────────────────────────
  // After Google OAuth redirect, the URL contains ?linked=google.
  // We sync the Google identity's `sub` to profiles.google_id.
  useEffect(() => {
    if (searchParams.get("linked") !== "google") return;

    async function syncGoogleId() {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        const gIdentity = user.identities?.find(
          (id) => id.provider === "google"
        );
        if (!gIdentity) return;

        const googleId = gIdentity.identity_data?.sub as string | undefined;
        const email = gIdentity.identity_data?.email as string | undefined;
        const googleAvatar = gIdentity.identity_data?.avatar_url as
          | string
          | undefined;

        if (googleId) {
          const updatePayload: Record<string, string | null> = {
            google_id: googleId,
          };
          if (!avatarUrl && googleAvatar) {
            updatePayload.avatar_url = googleAvatar;
          }

          const { error } = await supabase
            .from("profiles")
            .update(updatePayload)
            .eq("id", user.id);

          if (error) {
            if (error.code === "23505") {
              setLinkMessage({ type: "error", text: t("googleAlreadyLinked") });
            } else {
              setLinkMessage({ type: "error", text: t("linkFailed") });
            }
          } else {
            setGoogleIdentity(gIdentity);
            setGoogleEmail(email ?? null);
            if (!avatarUrl && googleAvatar) onAvatarChange(googleAvatar);
            setLinkMessage({ type: "success", text: t("googleLinked") });
          }
        }
      } catch {
        setLinkMessage({ type: "error", text: t("linkFailed") });
      }

      const url = new URL(window.location.href);
      url.searchParams.delete("linked");
      window.history.replaceState({}, "", url.toString());
    }

    syncGoogleId();
  }, [searchParams, t, avatarUrl, onAvatarChange]);

  // ── Post-GitHub-link handler ──────────────────────────────────
  // After GitHub OAuth redirect, the URL contains ?linked=github.
  // We sync the GitHub identity's `id` to profiles.github_id.
  useEffect(() => {
    if (searchParams.get("linked") !== "github") return;

    async function syncGitHubId() {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        const ghIdentity = user.identities?.find(
          (id) => id.provider === "github"
        );
        if (!ghIdentity) return;

        const githubId = ghIdentity.identity_data?.sub as string | undefined;
        const email = ghIdentity.identity_data?.email as string | undefined;
        const ghAvatar = ghIdentity.identity_data?.avatar_url as
          | string
          | undefined;

        if (githubId) {
          const updatePayload: Record<string, string | null> = {
            github_id: githubId,
          };
          if (!avatarUrl && ghAvatar) {
            updatePayload.avatar_url = ghAvatar;
          }

          const { error } = await supabase
            .from("profiles")
            .update(updatePayload)
            .eq("id", user.id);

          if (error) {
            if (error.code === "23505") {
              setLinkMessage({ type: "error", text: t("githubAlreadyLinked") });
            } else {
              setLinkMessage({ type: "error", text: t("linkFailed") });
            }
          } else {
            setGitHubIdentity(ghIdentity);
            setGitHubEmail(email ?? null);
            if (!avatarUrl && ghAvatar) onAvatarChange(ghAvatar);
            setLinkMessage({ type: "success", text: t("githubLinked") });
          }
        }
      } catch {
        setLinkMessage({ type: "error", text: t("linkFailed") });
      }

      const url = new URL(window.location.href);
      url.searchParams.delete("linked");
      window.history.replaceState({}, "", url.toString());
    }

    syncGitHubId();
  }, [searchParams, t, avatarUrl, onAvatarChange]);

  // ── Deferred wallet link ──────────────────────────────────────
  useEffect(() => {
    if (!pendingWalletLink.current || !publicKey || !signMessage) return;
    pendingWalletLink.current = false;

    let cancelled = false;

    async function linkWallet() {
      setIsLinkingWallet(true);
      setLinkMessage(null);

      try {
        const address = publicKey!.toBase58();

        // Fetch server-issued nonce (must exist in siws_nonces table)
        const nonceRes = await fetch("/api/auth/nonce");
        if (!nonceRes.ok) throw new Error("Failed to fetch nonce");
        const { nonce, domain } = (await nonceRes.json()) as {
          nonce: string;
          domain: string;
        };
        if (cancelled) return;

        const siwsMessage = createSIWSMessage({
          domain,
          address,
          statement: "Link this wallet to your Superteam LMS account",
          nonce,
        });
        const formatted = formatSIWSMessage(siwsMessage);
        const encoded = new TextEncoder().encode(formatted);
        const sig = await signMessage!(encoded);

        if (cancelled) return;

        const res = await fetch("/api/auth/link-wallet", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: formatted,
            signature: Array.from(sig),
            publicKey: address,
          }),
        });

        if (cancelled) return;

        if (!res.ok) {
          const data = await res.json();
          if (
            data.error === "walletAlreadyLinked" ||
            data.error === "differentWalletLinked"
          ) {
            setLinkMessage({
              type: "error",
              text: t("walletAlreadyLinked"),
            });
          } else {
            setLinkMessage({ type: "error", text: t("linkFailed") });
          }
          return;
        }

        setWalletAddress(address);
        setLinkMessage({ type: "success", text: t("walletLinked") });
        await refreshProfile();
      } catch {
        if (!cancelled) {
          setLinkMessage({ type: "error", text: t("linkFailed") });
        }
      } finally {
        if (!cancelled) {
          setIsLinkingWallet(false);
        }
      }
    }

    linkWallet();

    return () => {
      cancelled = true;
    };
  }, [publicKey, signMessage, t, refreshProfile]);

  // ── Link handlers ─────────────────────────────────────────────
  const handleLinkWallet = async () => {
    if (connected && publicKey && signMessage) {
      setIsLinkingWallet(true);
      setLinkMessage(null);

      try {
        const address = publicKey.toBase58();

        // Fetch server-issued nonce (must exist in siws_nonces table)
        const nonceRes = await fetch("/api/auth/nonce");
        if (!nonceRes.ok) throw new Error("Failed to fetch nonce");
        const { nonce, domain } = (await nonceRes.json()) as {
          nonce: string;
          domain: string;
        };

        const siwsMessage = createSIWSMessage({
          domain,
          address,
          statement: "Link this wallet to your Superteam LMS account",
          nonce,
        });
        const formatted = formatSIWSMessage(siwsMessage);
        const encoded = new TextEncoder().encode(formatted);
        const sig = await signMessage(encoded);

        const res = await fetch("/api/auth/link-wallet", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: formatted,
            signature: Array.from(sig),
            publicKey: address,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          if (
            data.error === "walletAlreadyLinked" ||
            data.error === "differentWalletLinked"
          ) {
            setLinkMessage({
              type: "error",
              text: t("walletAlreadyLinked"),
            });
          } else {
            setLinkMessage({ type: "error", text: t("linkFailed") });
          }
          return;
        }

        setWalletAddress(address);
        setLinkMessage({ type: "success", text: t("walletLinked") });
        await refreshProfile();
      } catch {
        setLinkMessage({ type: "error", text: t("linkFailed") });
      } finally {
        setIsLinkingWallet(false);
      }
    } else {
      pendingWalletLink.current = true;
      openWalletModal(true);
    }
  };

  const handleLinkGoogle = async () => {
    setIsLinkingGoogle(true);
    setLinkMessage(null);

    try {
      const supabase = createClient();
      const redirectPath = `/${locale}/settings`;
      const callbackUrl = `${window.location.origin}/api/auth/callback?next=${encodeURIComponent(`${redirectPath}?linked=google`)}`;

      const { data, error } = await supabase.auth.linkIdentity({
        provider: "google",
        options: { redirectTo: callbackUrl },
      });

      if (error) {
        console.error("[link-google]", error.message);
        setIsLinkingGoogle(false);
        setLinkMessage({ type: "error", text: t("linkFailed") });
        return;
      }

      if (data?.url) {
        window.location.assign(data.url);
      }
    } catch {
      setIsLinkingGoogle(false);
      setLinkMessage({ type: "error", text: t("linkFailed") });
    }
  };

  const handleLinkGitHub = async () => {
    setIsLinkingGitHub(true);
    setLinkMessage(null);

    try {
      const supabase = createClient();
      const redirectPath = `/${locale}/settings`;
      const callbackUrl = `${window.location.origin}/api/auth/callback?next=${encodeURIComponent(`${redirectPath}?linked=github`)}`;

      const { data, error } = await supabase.auth.linkIdentity({
        provider: "github",
        options: { redirectTo: callbackUrl },
      });

      if (error) {
        console.error("[link-github]", error.message);
        setIsLinkingGitHub(false);
        setLinkMessage({ type: "error", text: t("linkFailed") });
        return;
      }

      if (data?.url) {
        window.location.assign(data.url);
      }
    } catch {
      setIsLinkingGitHub(false);
      setLinkMessage({ type: "error", text: t("linkFailed") });
    }
  };

  const handleUnlinkGoogle = async () => {
    setLinkMessage(null);
    try {
      const res = await fetch("/api/auth/unlink", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: "google" }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === "cannotUnlinkLast") {
          setLinkMessage({ type: "error", text: t("cannotUnlinkLastHint") });
        } else {
          setLinkMessage({ type: "error", text: t("unlinkFailed") });
        }
        return;
      }
      setGoogleIdentity(null);
      setGoogleEmail(null);
      setLinkMessage({ type: "success", text: t("googleUnlinked") });
    } catch {
      setLinkMessage({ type: "error", text: t("unlinkFailed") });
    }
  };

  const handleUnlinkGitHub = async () => {
    setLinkMessage(null);
    try {
      const res = await fetch("/api/auth/unlink", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: "github" }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === "cannotUnlinkLast") {
          setLinkMessage({ type: "error", text: t("cannotUnlinkLastHint") });
        } else {
          setLinkMessage({ type: "error", text: t("unlinkFailed") });
        }
        return;
      }
      setGitHubIdentity(null);
      setGitHubEmail(null);
      setLinkMessage({ type: "success", text: t("githubUnlinked") });
    } catch {
      setLinkMessage({ type: "error", text: t("unlinkFailed") });
    }
  };

  // Unlink safety: must have at least 2 linked methods to unlink any one
  const linkedCount =
    (walletAddress ? 1 : 0) +
    (googleIdentity ? 1 : 0) +
    (gitHubIdentity ? 1 : 0);
  const canUnlink = linkedCount >= 2;

  return (
    <Card>
      <CardContent className="space-y-6 p-6">
        <h3 className="font-display font-black">{t("connectedAccounts")}</h3>

        {/* Feedback banner */}
        {linkMessage && (
          <div
            className={`rounded-lg border px-4 py-3 text-sm ${
              linkMessage.type === "success"
                ? "bg-success-light text-success-dark [border-color:var(--success-border)]"
                : "text-danger [background:var(--danger-light)] [border-color:var(--danger-border)]"
            }`}
          >
            {linkMessage.text}
          </div>
        )}

        {/* Wallet row */}
        <div className="flex items-center justify-between rounded-lg border-[2.5px] border-border p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-bg">
              <SolanaLogo className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium">{t("walletAddress")}</p>
              <p className="text-sm text-text-3">
                {walletAddress
                  ? `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`
                  : t("notLinked")}
              </p>
              {walletAddress && (
                <p className="mt-0.5 text-xs text-text-3">
                  {t("walletPermanent")}
                </p>
              )}
            </div>
          </div>
          {!walletAddress && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleLinkWallet}
              disabled={isLinkingWallet}
            >
              {isLinkingWallet && (
                <div className="mr-2 h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
              )}
              {isLinkingWallet ? t("linking") : t("linkWallet")}
            </Button>
          )}
        </div>

        {/* Google row */}
        <div className="flex items-center justify-between rounded-lg border-[2.5px] border-border p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-subtle">
              <GoogleLogo className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium">{t("googleAccount")}</p>
              <p className="text-sm text-text-3">
                {googleEmail ?? t("notLinked")}
              </p>
            </div>
          </div>
          {googleIdentity ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleUnlinkGoogle}
              disabled={!canUnlink}
              title={!canUnlink ? t("cannotUnlinkLastHint") : undefined}
            >
              {t("unlink")}
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={handleLinkGoogle}
              disabled={isLinkingGoogle}
            >
              {isLinkingGoogle && (
                <div className="mr-2 h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
              )}
              {isLinkingGoogle ? t("linking") : t("linkGoogle")}
            </Button>
          )}
        </div>

        {/* GitHub row */}
        <div className="flex items-center justify-between rounded-lg border-[2.5px] border-border p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-subtle">
              <GithubLogo className="h-5 w-5" weight="fill" />
            </div>
            <div>
              <p className="font-medium">{t("githubAccount")}</p>
              <p className="text-sm text-text-3">
                {gitHubEmail ?? t("notLinked")}
              </p>
            </div>
          </div>
          {gitHubIdentity ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleUnlinkGitHub}
              disabled={!canUnlink}
              title={!canUnlink ? t("cannotUnlinkLastHint") : undefined}
            >
              {t("unlink")}
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={handleLinkGitHub}
              disabled={isLinkingGitHub}
            >
              {isLinkingGitHub && (
                <div className="mr-2 h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
              )}
              {isLinkingGitHub ? t("linking") : t("linkGitHub")}
            </Button>
          )}
        </div>

        {/* Safety hint — show when only one provider is linked */}
        {linkedCount === 1 && (
          <p className="text-xs text-text-3">{t("cannotUnlinkLastHint")}</p>
        )}
      </CardContent>
    </Card>
  );
}
