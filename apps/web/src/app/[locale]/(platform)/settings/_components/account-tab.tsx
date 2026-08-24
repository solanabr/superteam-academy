"use client";

import { useEffect, useState, useRef, useCallback } from "react";
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
import type { Database } from "@/lib/supabase/types";
import { useAuth } from "@/lib/auth/auth-provider";
import { isWalletPlaceholderEmail } from "@/lib/auth/wallet-placeholder";
import { isDynamicEnabled } from "@/lib/dynamic/config";
import { createSIWSMessage, formatSIWSMessage } from "@/lib/solana/wallet-auth";
import {
  DynamicSessionProbe,
  type DynamicSessionInfo,
} from "./dynamic-session-probe";

// ── Types ─────────────────────────────────────────────────────────
interface AccountTabProps {
  /**
   * The Supabase account email — synthetic (`@wallet.superteam-lms.local`)
   * for wallet-first accounts. Drives the unlink recovery copy and guard.
   */
  accountEmail: string | null;
  initialWalletAddress: string | null;
  initialGoogleEmail: string | null;
  initialGoogleIdentity: UserIdentity | null;
  initialGitHubEmail: string | null;
  initialGitHubIdentity: UserIdentity | null;
  avatarUrl: string | null;
  onAvatarChange: (url: string | null) => void;
}

type OAuthProvider = "google" | "github";

/**
 * Everything that differs between the Google and GitHub rows — the two link
 * flows, unlink flows, and post-redirect sync effects are otherwise the same
 * code, and were literally copy-pasted before #1077.
 */
const OAUTH_PROVIDERS: Record<
  OAuthProvider,
  {
    idColumn: "google_id" | "github_id";
    nameKey: string;
    linkLabelKey: string;
    linkedKey: string;
    unlinkedKey: string;
    alreadyLinkedKey: string;
  }
> = {
  google: {
    idColumn: "google_id",
    nameKey: "googleAccount",
    linkLabelKey: "linkGoogle",
    linkedKey: "googleLinked",
    unlinkedKey: "googleUnlinked",
    alreadyLinkedKey: "googleAlreadyLinked",
  },
  github: {
    idColumn: "github_id",
    nameKey: "githubAccount",
    linkLabelKey: "linkGitHub",
    linkedKey: "githubLinked",
    unlinkedKey: "githubUnlinked",
    alreadyLinkedKey: "githubAlreadyLinked",
  },
};

const PROVIDER_ICONS: Record<OAuthProvider, React.ReactNode> = {
  google: <GoogleLogo className="h-5 w-5" />,
  github: <GithubLogo className="h-5 w-5" weight="fill" />,
};

interface OAuthAccountState {
  email: string | null;
  identity: UserIdentity | null;
}

export function AccountTab({
  accountEmail,
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
  const [oauth, setOauth] = useState<Record<OAuthProvider, OAuthAccountState>>({
    google: { email: initialGoogleEmail, identity: initialGoogleIdentity },
    github: { email: initialGitHubEmail, identity: initialGitHubIdentity },
  });
  const [isLinkingWallet, setIsLinkingWallet] = useState(false);
  // Which OAuth link redirect is starting; link ends in a full-page nav, so
  // only one can be in flight.
  const [linkingProvider, setLinkingProvider] = useState<OAuthProvider | null>(
    null
  );
  // Shared across BOTH unlink buttons (#1053 gate F2): firing google+github
  // unlinks inside one round-trip let a synthetic-email account race past the
  // sole-OAuth guard, since each request read pre-unlink state.
  const [isUnlinking, setIsUnlinking] = useState(false);
  const [linkMessage, setLinkMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  // What the Dynamic session knows beyond Supabase's identity list — which
  // social provider signed the learner in, and the embedded wallet it created.
  // Null until the probe reports (and forever when Dynamic is off), which
  // renders exactly the legacy rows.
  const [dynamicSession, setDynamicSession] =
    useState<DynamicSessionInfo | null>(null);
  const pendingWalletLink = useRef(false);

  const setProviderAccount = useCallback(
    (provider: OAuthProvider, account: OAuthAccountState) => {
      setOauth((prev) => ({ ...prev, [provider]: account }));
    },
    []
  );

  // ── Post-OAuth-link handler ───────────────────────────────────
  // After the OAuth redirect, the URL contains ?linked=google|github.
  // We sync the identity's `sub` to profiles.google_id / github_id.
  useEffect(() => {
    const linked = searchParams.get("linked");
    if (linked !== "google" && linked !== "github") return;
    const provider: OAuthProvider = linked;
    const config = OAUTH_PROVIDERS[provider];

    async function syncProviderId() {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        const identity = user.identities?.find(
          (id) => id.provider === provider
        );
        if (!identity) return;

        const providerId = identity.identity_data?.sub as string | undefined;
        const email = identity.identity_data?.email as string | undefined;
        const providerAvatar = identity.identity_data?.avatar_url as
          | string
          | undefined;

        if (providerId) {
          const updatePayload: Database["public"]["Tables"]["profiles"]["Update"] =
            {
              [config.idColumn]: providerId,
            };
          if (!avatarUrl && providerAvatar) {
            updatePayload.avatar_url = providerAvatar;
          }

          const { error } = await supabase
            .from("profiles")
            .update(updatePayload)
            .eq("id", user.id);

          if (error) {
            if (error.code === "23505") {
              setLinkMessage({
                type: "error",
                text: t(config.alreadyLinkedKey),
              });
            } else {
              setLinkMessage({ type: "error", text: t("linkFailed") });
            }
          } else {
            setProviderAccount(provider, { email: email ?? null, identity });
            if (!avatarUrl && providerAvatar) onAvatarChange(providerAvatar);
            setLinkMessage({ type: "success", text: t(config.linkedKey) });
          }
        }
      } catch {
        setLinkMessage({ type: "error", text: t("linkFailed") });
      }

      const url = new URL(window.location.href);
      url.searchParams.delete("linked");
      window.history.replaceState({}, "", url.toString());
    }

    syncProviderId();
  }, [searchParams, t, avatarUrl, onAvatarChange, setProviderAccount]);

  // ── Wallet link (shared by the button and the deferred effect) ─
  // `isCancelled` lets the effect path bail after unmount; the direct
  // button path passes a constant false.
  const performWalletLink = useCallback(
    async (isCancelled: () => boolean) => {
      if (!publicKey || !signMessage) return;
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
        if (isCancelled()) return;

        const siwsMessage = createSIWSMessage({
          domain,
          address,
          statement: "Link this wallet to your Superteam LMS account",
          nonce,
        });
        const formatted = formatSIWSMessage(siwsMessage);
        const encoded = new TextEncoder().encode(formatted);
        const sig = await signMessage(encoded);

        if (isCancelled()) return;

        const res = await fetch("/api/auth/link-wallet", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: formatted,
            signature: Array.from(sig),
            publicKey: address,
            // This tab links an extension wallet through wallet-adapter; the
            // embedded one is linked by DynamicAuthHandler, never here.
            walletKind: "external",
          }),
        });

        if (isCancelled()) return;

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
        if (!isCancelled()) {
          setLinkMessage({ type: "error", text: t("linkFailed") });
        }
      } finally {
        if (!isCancelled()) {
          setIsLinkingWallet(false);
        }
      }
    },
    [publicKey, signMessage, t, refreshProfile]
  );

  // ── Deferred wallet link ──────────────────────────────────────
  useEffect(() => {
    if (!pendingWalletLink.current || !publicKey || !signMessage) return;
    pendingWalletLink.current = false;

    let cancelled = false;
    performWalletLink(() => cancelled);

    return () => {
      cancelled = true;
    };
  }, [publicKey, signMessage, performWalletLink]);

  // ── Link handlers ─────────────────────────────────────────────
  const handleLinkWallet = async () => {
    if (connected && publicKey && signMessage) {
      await performWalletLink(() => false);
    } else {
      pendingWalletLink.current = true;
      openWalletModal(true);
    }
  };

  const handleLinkOAuth = async (provider: OAuthProvider) => {
    setLinkingProvider(provider);
    setLinkMessage(null);

    try {
      const supabase = createClient();
      const redirectPath = `/${locale}/settings`;
      const callbackUrl = `${window.location.origin}/api/auth/callback?next=${encodeURIComponent(`${redirectPath}?linked=${provider}`)}`;

      const { data, error } = await supabase.auth.linkIdentity({
        provider,
        options: { redirectTo: callbackUrl },
      });

      if (error) {
        console.error(`[link-${provider}]`, error.message);
        setLinkingProvider(null);
        setLinkMessage({ type: "error", text: t("linkFailed") });
        return;
      }

      if (data?.url) {
        window.location.assign(data.url);
      }
    } catch {
      setLinkingProvider(null);
      setLinkMessage({ type: "error", text: t("linkFailed") });
    }
  };

  const handleUnlinkOAuth = async (provider: OAuthProvider) => {
    if (isUnlinking) return;
    setIsUnlinking(true);
    setLinkMessage(null);
    try {
      const res = await fetch("/api/auth/unlink", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === "cannotUnlinkLast") {
          setLinkMessage({ type: "error", text: t("cannotUnlinkLastHint") });
        } else if (data.error === "cannotUnlinkOnlyRecovery") {
          setLinkMessage({
            type: "error",
            text: t("cannotUnlinkOnlyRecoveryHint"),
          });
        } else {
          setLinkMessage({ type: "error", text: t("unlinkFailed") });
        }
        return;
      }
      setProviderAccount(provider, { email: null, identity: null });
      setLinkMessage({
        type: "success",
        text: t(OAUTH_PROVIDERS[provider].unlinkedKey),
      });
    } catch {
      setLinkMessage({ type: "error", text: t("unlinkFailed") });
    } finally {
      setIsUnlinking(false);
    }
  };

  // Unlink safety: must have at least 2 linked methods to unlink any one
  const linkedCount =
    (walletAddress ? 1 : 0) +
    (oauth.google.identity ? 1 : 0) +
    (oauth.github.identity ? 1 : 0);
  const canUnlink = linkedCount >= 2;

  // Wallet-first accounts (synthetic email) cannot recover through the email
  // bridge, so their last OAuth identity is their only path back in if wallet
  // access is lost — the server refuses to unlink it and the button says why
  // up front. Real-email accounts get the opposite message: unlinking is
  // safe, the bridge matches by email.
  const isSyntheticEmail = isWalletPlaceholderEmail(accountEmail);
  const oauthCount =
    (oauth.google.identity ? 1 : 0) + (oauth.github.identity ? 1 : 0);
  const soleOauthLocked = isSyntheticEmail && oauthCount === 1;

  // The wallet row only claims "embedded" when the Dynamic session's Solana
  // address IS the profile wallet — an external wallet linked by a learner who
  // also has a Dynamic session must keep the plain permanent copy.
  const isEmbeddedWallet =
    walletAddress !== null && dynamicSession?.solanaAddress === walletAddress;

  const usedViaDynamic = (provider: OAuthProvider): boolean =>
    provider === "google"
      ? Boolean(dynamicSession?.hasGoogle)
      : Boolean(dynamicSession?.hasGithub);

  // The count-vs-lived-experience reconcile (#1077): a learner who signs in
  // daily with Google through Dynamic reads "at least one sign-in method"
  // while feeling they already have two. When their Dynamic provider isn't a
  // Supabase-linked identity yet, the safety hint says so explicitly.
  const hasUnlinkedDynamicProvider = (["google", "github"] as const).some(
    (provider) => usedViaDynamic(provider) && !oauth[provider].identity
  );

  return (
    <Card>
      <CardContent className="space-y-6 p-6">
        {/* Hooks gate (see dynamic-session-probe.tsx): mounted only when the
            feature is on, so a Dynamic-less build renders the legacy tab. */}
        {isDynamicEnabled() && (
          <DynamicSessionProbe onSession={setDynamicSession} />
        )}

        <h3 className="set-group-title">{t("connectedAccounts")}</h3>

        {/* Recovery context (#unlink decision 2026-08-17): tell each account
            shape what unlinking means BEFORE they click, not in an error. */}
        {soleOauthLocked ? (
          <p className="text-sm text-text-3">
            {t("syntheticEmailRecoveryNote")}
          </p>
        ) : !isSyntheticEmail && accountEmail && oauthCount > 0 ? (
          <p className="text-sm text-text-3">
            {t("realEmailRecoveryNote", { email: accountEmail })}
          </p>
        ) : null}

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
        <div className="set-row">
          <div className="flex items-center gap-3">
            <div className="set-row-icon">
              <SolanaLogo className="h-5 w-5" />
            </div>
            <div>
              <p className="set-row-name">{t("walletAddress")}</p>
              <p className="set-row-meta font-mono">
                {walletAddress
                  ? `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`
                  : t("notLinked")}
              </p>
              {walletAddress && (
                <p className="set-row-meta">
                  {isEmbeddedWallet
                    ? t("walletEmbeddedDynamic")
                    : t("walletPermanent")}
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

        {/* The Phantom "take your wallet with you" card is gone with Phantom
            Connect. Dynamic's embedded wallets are exportable from its own
            account UI, so a bespoke graduation card here would duplicate — and
            drift from — instructions the vendor already owns. */}

        {/* OAuth rows. A Dynamic social sign-in leaves no Supabase identity,
            so without the `usedViaDynamic` branch the learner who just used
            that provider reads "Not Linked" — the row states the Dynamic truth
            instead, and the Link button stays: linking adds direct sign-in and
            a recovery path. */}
        {(["google", "github"] as const).map((provider) => {
          const config = OAUTH_PROVIDERS[provider];
          const account = oauth[provider];
          const viaDynamic = usedViaDynamic(provider);
          return (
            <div className="set-row" key={provider}>
              <div className="flex items-center gap-3">
                <div className="set-row-icon">{PROVIDER_ICONS[provider]}</div>
                <div>
                  <p className="set-row-name">{t(config.nameKey)}</p>
                  <p className="set-row-meta">
                    {account.email ??
                      (viaDynamic ? t("usedForSignInDynamic") : t("notLinked"))}
                  </p>
                  {!account.identity && viaDynamic && (
                    <p className="set-row-meta">{t("dynamicLinkHint")}</p>
                  )}
                </div>
              </div>
              {account.identity ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleUnlinkOAuth(provider)}
                  disabled={!canUnlink || soleOauthLocked || isUnlinking}
                  title={
                    soleOauthLocked
                      ? t("cannotUnlinkOnlyRecoveryHint")
                      : !canUnlink
                        ? t("cannotUnlinkLastHint")
                        : undefined
                  }
                >
                  {t("unlink")}
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleLinkOAuth(provider)}
                  disabled={linkingProvider !== null}
                >
                  {linkingProvider === provider && (
                    <div className="mr-2 h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  )}
                  {linkingProvider === provider
                    ? t("linking")
                    : t(config.linkLabelKey)}
                </Button>
              )}
            </div>
          );
        })}

        {/* Safety hint — show when only one provider is linked. The Dynamic
            variant reconciles the count with the learner's lived experience:
            their social sign-in exists, it just isn't a LINKED method yet. */}
        {linkedCount === 1 && (
          <p className="text-xs text-text-3">
            {hasUnlinkedDynamicProvider
              ? t("dynamicMethodCountNote")
              : t("cannotUnlinkLastHint")}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
