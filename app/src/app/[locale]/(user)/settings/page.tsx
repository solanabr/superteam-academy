"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useAPIQuery } from "@/lib/api/useAPI";
import { useAuthStore } from "@/store/auth-store";
import { Link } from "@/i18n/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { WalletStatus } from "@/components/layout/wallet-status";
import { LogOut } from "lucide-react";

const cardClass =
  "rounded-none border-2 border-border bg-card shadow-[3px_3px_0_0_hsl(var(--foreground)_/_0.15)]";

type ProfileData = {
  wallet_public_key: string | null;
  linked_connections: { provider: string }[];
};

export default function SettingsPage() {
  const t = useTranslations("settings");
  const tAuth = useTranslations("auth");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const session = useAuthStore((s) => s.session);
  const isLoaded = useAuthStore((s) => s.is_loaded);
  const clearSession = useAuthStore((s) => s.clear);
  const [logoutPending, setLogoutPending] = useState(false);

  const handleLogout = async () => {
    setLogoutPending(true);
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
      clearSession();
      router.push("/login");
    } finally {
      setLogoutPending(false);
    }
  };

  const { data: profile } = useAPIQuery<ProfileData>({
    queryKey: ["profile"],
    path: "/api/user/profile",
    enabled: Boolean(session),
  });

  if (!isLoaded || !session) return null;

  const connections = profile?.linked_connections ?? [];
  const hasGoogle = connections.some((c) => c.provider === "google");
  const hasGithub = connections.some((c) => c.provider === "github");
  const oauthBase = "/api/auth/oauth";
  const redirectTo = `/${locale}/settings`;

  return (
    <div className="container mx-auto space-y-8 p-4 md:p-6">
      <h1 className="text-2xl font-bold text-foreground">{t("title")}</h1>

      <Card className={cardClass}>
        <CardHeader>
          <CardTitle className="text-lg">{t("linkedAccounts")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-none border-2 border-border p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="font-semibold">{t("wallet")}</span>
            </div>
            <WalletStatus />
          </div>

          <div className="flex items-center justify-between rounded-none border-2 border-border p-4">
            <span className="font-semibold">{t("google")}</span>
            {hasGoogle ? (
              <span className="text-sm text-primary">{t("connected")}</span>
            ) : (
              <a
                href={`${oauthBase}/google?redirect_to=${encodeURIComponent(redirectTo)}`}
                className="rounded-none border-2 border-foreground bg-background px-3 py-2 text-sm font-semibold hover:bg-muted"
              >
                {t("connect")}
              </a>
            )}
          </div>

          <div className="flex items-center justify-between rounded-none border-2 border-border p-4">
            <span className="font-semibold">{t("github")}</span>
            {hasGithub ? (
              <span className="text-sm text-primary">{t("connected")}</span>
            ) : (
              <a
                href={`${oauthBase}/github?redirect_to=${encodeURIComponent(redirectTo)}`}
                className="rounded-none border-2 border-foreground bg-background px-3 py-2 text-sm font-semibold hover:bg-muted"
              >
                {t("connect")}
              </a>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-3">
        <Link href="/profile">
          <Button variant="outline" className="rounded-none border-2">
            {t("goToProfile")}
          </Button>
        </Link>
        <Button
          type="button"
          variant="outline"
          className="rounded-none border-2 border-destructive/50 text-destructive hover:bg-destructive/10 hover:border-destructive"
          onClick={() => void handleLogout()}
          disabled={logoutPending}
        >
          <LogOut className="size-4 shrink-0" aria-hidden />
          {logoutPending ? tCommon("loading") : tAuth("logout")}
        </Button>
      </div>
    </div>
  );
}
