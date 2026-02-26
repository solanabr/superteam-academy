"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { usePrivy, useLinkAccount } from "@privy-io/react-auth";
import { Wallet, Mail, Github } from "lucide-react";
import { useWalletCompat } from "@/lib/hooks/use-wallet-compat";
import { truncateAddress } from "@/lib/utils";

export function AccountTab() {
  const t = useTranslations("settings");
  const { publicKey, connected, disconnect } = useWalletCompat();
  const { user } = usePrivy();
  const { linkGoogle, linkGithub, linkWallet } = useLinkAccount();

  const googleLinked = !!user?.google;
  const githubLinked = !!user?.github;

  const [email, setEmail] = useState(user?.google?.email ?? "");

  return (
    <div className="space-y-8">
      {/* Connected Wallets */}
      <div>
        <h3 className="text-lg font-semibold">
          {t("accountSection.walletAddress")}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("accountSection.walletsDescription")}
        </p>
        <div className="mt-4 space-y-3">
          {connected && publicKey ? (
            <div className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-st-green/10">
                  <Wallet className="h-5 w-5 text-st-green" />
                </div>
                <div>
                  <p className="font-mono text-sm font-medium text-foreground">
                    {truncateAddress(publicKey.toBase58(), 6)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t("accountSection.primaryWallet")}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => disconnect()}
                className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-destructive hover:text-destructive"
              >
                {t("accountSection.disconnect")}
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between rounded-lg border border-dashed border-border bg-card/50 px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                  <Wallet className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {t("accountSection.noWallet")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t("accountSection.connectWalletHint")}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => linkWallet()}
                className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-st-green hover:text-st-green"
              >
                {t("accountSection.connect")}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Sign-in Methods */}
      <div>
        <h3 className="text-lg font-semibold">
          {t("accountSection.signInMethods")}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("accountSection.signInMethodsDescription")}
        </p>
        <div className="mt-4 space-y-3">
          {/* Google */}
          <div className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                <Mail className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Google</p>
                <p className="text-xs text-muted-foreground">
                  {googleLinked
                    ? user?.google?.email
                    : t("accountSection.notConnected")}
                </p>
              </div>
            </div>
            {googleLinked ? (
              <span className="rounded-full bg-brazil-green/10 px-3 py-1 text-xs font-medium text-brazil-green">
                {t("accountSection.connected")}
              </span>
            ) : (
              <button
                type="button"
                onClick={() => linkGoogle()}
                className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-st-green hover:text-st-green"
              >
                {t("accountSection.connect")}
              </button>
            )}
          </div>

          {/* GitHub */}
          <div className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                <Github className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">GitHub</p>
                <p className="text-xs text-muted-foreground">
                  {githubLinked
                    ? user?.github?.username
                    : t("accountSection.notConnected")}
                </p>
              </div>
            </div>
            {githubLinked ? (
              <span className="rounded-full bg-brazil-green/10 px-3 py-1 text-xs font-medium text-brazil-green">
                {t("accountSection.connected")}
              </span>
            ) : (
              <button
                type="button"
                onClick={() => linkGithub()}
                className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-st-green hover:text-st-green"
              >
                {t("accountSection.connect")}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Email */}
      <div>
        <h3 className="text-lg font-semibold">{t("profileSection.email")}</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("profileSection.emailDescription")}
        </p>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-4 w-full rounded-lg border border-border bg-card px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-st-green focus:outline-none focus:ring-1 focus:ring-st-green"
          placeholder={t("profileSection.emailPlaceholder")}
        />
      </div>
    </div>
  );
}
